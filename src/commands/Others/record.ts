import fs from 'fs';
import { resolve } from 'path';

import Command from '../../structures/Command';
import Client from '../../structures/Client';
import CommandContext from '../../structures/CommandContext';
import { VoiceChannel } from 'eris';

import { Worker } from 'worker_threads';

export default class Record extends Command {
  constructor(client: Client) {
    super(client, {
      name: 'record',
      description: 'Grava áudio num canal de voz.',
      category: 'Others',
      aliases: ['rec'],
      cooldown: 5
    });
  }

  async execute(ctx: CommandContext): Promise<void> {
    const voiceChannelID = ctx.member!.voiceState.channelID;

    if (!voiceChannelID) {
      ctx.sendMessage({ content: ':x: Precisas de estar num canal de voz para executar esse comando!', flags: 1 << 6 });
      return;
    }

    if (this.client.music.players.get(ctx.guild.id)) {
      ctx.sendMessage({ content: ':x: Não consigo gravar áudio enquanto toco música!', flags: 1 << 6 });
      return;
    }

    const rec = this.client.records.get(ctx.guild.id);
    if (rec) {
      if (voiceChannelID !== rec.voiceChannelID) {
        ctx.sendMessage({ content: ':x: Precisas de estar no mesmo canal de voz que eu para usar esse comando!', flags: 1 << 6 });
        return;
      }

      clearTimeout(rec.timeout);
      rec.worker.postMessage({ op: 0 });
      this.client.records.delete(ctx.guild.id);
      return;
    }

    const voiceChannel = this.client.getChannel(voiceChannelID) as VoiceChannel;

    const permissions = voiceChannel.permissionsOf(this.client.user.id);

    if (!permissions.has('readMessages')) {
      ctx.sendMessage({ content: ':x: Não tenho permissão para ver o teu canal de voz!', flags: 1 << 6 });
      return;
    }

    if (!permissions.has('voiceConnect')) {
      ctx.sendMessage({ content: ':x: Não tenho permissão para entrar no teu canal de voz!', flags: 1 << 6 });
      return;
    }

    const worker = new Worker(resolve(__dirname, '..', '..', 'workers', 'ReceiveWorker.js'));

    const voiceConnection = await voiceChannel.join({
      selfMute: true,
    });

    const stream = voiceConnection.receive('pcm');

    stream.on('data', (data, userID) => {
      if (!userID) return;
      worker.postMessage({ op: 2, userID, packet: data });
    });


    worker.postMessage({ guildID: ctx.guild.id, op: 1, bitrate: voiceChannel.bitrate });

    worker.once('message', async (data) => {
      if (data.done) {
        worker.terminate();
        voiceConnection.disconnect();
        const audioFile = fs.readFileSync(`./records/record-${ctx.guild.id}.mp3`);

        await ctx.sendMessage({
          content: ':stop_button: Gravação terminada!',
          files: [
            {
              name: 'record.mp3',
              file: audioFile
            }
          ]
        });

        fs.unlinkSync(`./records/record-${ctx.guild.id}.mp3`);
      }
    });

    const timeout = setTimeout(() => {
      worker.postMessage({ op: 0 });
      return;
    }, 8 * 60 * 1000);

    this.client.records.set(ctx.guild.id, {
      worker,
      timeout,
      voiceChannelID,
    });

    ctx.sendMessage(':red_circle: Gravação iniciada! (Máximo de 8 minutos).')
  }
}
