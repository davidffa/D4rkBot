import Command from '../../structures/Command';
import Client from '../../structures/Client';
import CommandContext from '../../structures/CommandContext';
import { VoiceChannel } from 'eris';
import { Node } from 'vulkava';

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

  async onFinish(oldCtx: CommandContext, ctx: CommandContext | null, node: Node, id: string) {
    try {
      this.client.records.delete(id);
      const buf = await node.getRecord(oldCtx.guild.id, id);
      node.deleteRecord(oldCtx.guild.id, id);

      if (ctx) {
        ctx.sendMessage({
          content: ':stop_button: Gravação terminada!',
          files: [
            {
              name: 'record.mp3',
              file: buf
            }
          ]
        });
        return;
      }

      oldCtx.channel.createMessage({
        content: ':stop_button: Gravação terminada!',
      }, {
        name: 'record.mp3',
        file: buf
      });
    } catch (_) {
      if (ctx) {
        ctx.sendMessage(':x: Erro ao obter a gravação!');
        return;
      }
      oldCtx.channel.createMessage(':x: Erro ao obter a gravação!');
    }
  }

  async execute(ctx: CommandContext): Promise<void> {
    const voiceChannelID = ctx.member!.voiceState.channelID;

    if (!voiceChannelID) {
      ctx.sendMessage({ content: ':x: Precisas de estar num canal de voz para executar esse comando!', flags: 1 << 6 });
      return;
    }

    await ctx.defer();

    const rec = this.client.records.get(voiceChannelID);
    if (rec) {
      const player = this.client.music.players.get(ctx.guild.id)!!;
      if (voiceChannelID !== player?.voiceChannelId) {
        ctx.sendMessage({ content: ':x: Precisas de estar no mesmo canal de voz que eu para usar esse comando!', flags: 1 << 6 });
        return;
      }

      clearTimeout(rec.timeout);
      rec.newCtx = ctx;

      player.destroy();
      return;
    }

    if (this.client.music.players.get(ctx.guild.id)) {
      ctx.sendMessage({ content: ':x: Não consigo gravar áudio enquanto toco música!', flags: 1 << 6 });
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

    const player = this.client.music.createPlayer({
      guildId: ctx.guild.id,
      textChannelId: ctx.channel.id,
      voiceChannelId: voiceChannelID
    });

    player.connect();
    player.recorder.start({
      id: voiceChannelID,
      bitrate: voiceChannel.bitrate
    });

    const timeout = setTimeout(() => {
      player?.destroy();
    }, 8 * 60 * 1000);

    this.client.records.set(voiceChannelID, {
      timeout,
      onFinish: this.onFinish.bind(this),
      oldCtx: ctx
    });
    ctx.sendMessage(':red_circle: Gravação iniciada! (Máximo de 8 minutos).')
  }
}
