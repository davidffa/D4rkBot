/*
import Command from '../../structures/Command';
import Client from '../../structures/Client';
import CommandContext from '../../structures/CommandContext';

import fs from 'fs';
import { resolve } from 'path';

import { exec } from 'child_process';

export default class Record extends Command {
  constructor(client: Client) {
    super(client, {
      name: 'record',
      description: 'Grava áudio no canal de voz e envia em MP3.',
      category: 'Others',
      aliases: ['gravar', 'rec', 'gravaraudio', 'recordaudio'],
      cooldown: 8
    });
  }

  async execute(ctx: CommandContext): Promise<void> {
    if (ctx.channel.type !== 0 || !ctx.guild) return;

    const voiceChannelID = ctx.member?.voiceState.channelID;

    if (!voiceChannelID) {
      ctx.sendMessage(':x: Precisas de estar num canal de voz para usar esse comando!');
      return;
    }

    if (this.client.music.players.get(ctx.guild.id)) {
      ctx.sendMessage(':x: Não consigo gravar voz enquanto toco música!');
      return;
    }

    if (ctx.guild.voiceStates.get(this.client.user.id) && ctx.guild.voiceStates.get(this.client.user.id)?.channelID !== voiceChannelID) {
      ctx.sendMessage(':x: Precisas de estar no meu canal de voz para usar este comando!');
      return;
    }

    const voiceChannel = this.client.getChannel(voiceChannelID);
    if (!voiceChannel || voiceChannel.type !== 2) return;

    const saveRec = async (): Promise<void> => {
      if (ctx.channel.type !== 0 || !ctx.guild) return;

      voiceChannel.leave();

      const data = this.client.records.get(ctx.guild.id);
      data && clearTimeout(data.timeout);

      if (!data || !data.users.length) {
        ctx.sendMessage(':x: Gravação de áudio vazia!');
        this.client.records.delete(ctx.guild.id);
        return;
      }

      await ctx.sendMessage('<a:loading2:805088089319407667> A processar o áudio...');

      let cmd: string;

      const getFilePath = (name: string): string => {
        return resolve(__dirname, '..', '..', '..', 'records', `${name}`);
      }

      if (data.users.length === 1) {
        cmd = `ffmpeg -f s16le -ar 48k -ac 2 -i "${getFilePath(`${ctx.guild.id}-${data.users[0]}.pcm`)}" "${getFilePath(`${ctx.guild.id}.mp3`)}"`;
      } else {
        cmd = `ffmpeg ${data.users.map(u => `-f s16le -ar 48k -ac 2 -i "${getFilePath(`${ctx.guild?.id as string}-${u}.pcm`)}"`).join(' ')} -filter_complex amix=inputs=${data.users.length}:duration=longest "${getFilePath(`${ctx.guild.id}.mp3`)}"`;
      }

      exec(cmd, async () => {
        if (!ctx.guild) return;
        ctx.sentMsg.delete().catch(() => { });

        const mp3filePath = resolve(__dirname, '..', '..', '..', 'records', `${ctx.guild.id}.mp3`);
        const buffer = fs.readFileSync(mp3filePath);

        await ctx.sendMessage(`:red_circle: Gravação de áudio terminada!`, {
          name: 'áudio.mp3',
          file: buffer
        });

        fs.unlinkSync(mp3filePath);
        data.users.forEach(u => {
          fs.unlinkSync(resolve(__dirname, '..', '..', '..', 'records', `${ctx.guild?.id as string}-${u}.pcm`));
        })

        this.client.records.delete(ctx.guild.id as string);
      })
    }

    if (this.client.records.has(ctx.guild.id as string)) {
      saveRec();
      return;
    }

    const permissions = voiceChannel.permissionsOf(this.client.user.id);

    if (!permissions.has('readMessages')) {
      ctx.sendMessage(':x: Não tenho permissão para ver o teu canal de voz!');
      return;
    }

    if (!permissions.has('voiceConnect')) {
      ctx.sendMessage(':x: Não tenho permissão para entrar no teu canal de voz!');
      return;
    }

    if (!permissions.has('voiceSpeak')) {
      ctx.sendMessage(':x: Não tenho permissão para falar no teu canal de voz!');
      return;
    }

    if (!voiceChannel.permissionsOf(this.client.user.id).has('manageChannels') && voiceChannel.userLimit && voiceChannel.voiceMembers.size > voiceChannel.userLimit) {
      ctx.sendMessage(':x: O canal de voz está cheio!');
      return;
    }

    if (!fs.existsSync('./records'))
      fs.mkdirSync('./records');

    const connection = await voiceChannel.join({ opusOnly: false, shared: false });

    const stream = connection.receive('pcm');

    stream.on('data', (data, userID) => {
      if (!userID) return;
      if (!this.client.records.get(ctx.guild?.id as string)?.users.includes(userID)) this.client.records.get(ctx.guild?.id as string)?.users.push(userID);
      fs.appendFileSync(resolve(__dirname, '..', '..', '..', 'records', `${ctx.guild?.id as string}-${userID}.pcm`), data);
    });

    const timeout = setTimeout(() => {
      saveRec();
    }, 2 * 60 * 1000);

    this.client.records.set(ctx.guild?.id as string, { timeout, users: [] });

    ctx.sendMessage(':red_circle: Gravação de áudio iniciada, execute o comando de novo para parar a gravação!\nTempo máximo: `2 minutos`')
  }
}
*/