import Command from '../../structures/Command';
import Client from '../../structures/Client';
import CommandContext from '../../structures/CommandContext';

import { User } from 'eris';

export default class Stop extends Command {
  constructor(client: Client) {
    super(client, {
      name: 'stop',
      description: 'Para de tocar música e limpa a lista de músicas.',
      category: 'Music',
      aliases: ['parar', 'disconnect', 'desconectar', 'leave', 'sair', 'quit'],
      cooldown: 4,
    });
  }

  async execute(ctx: CommandContext): Promise<void> {
    if (ctx.channel.type !== 0) return;

    const player = this.client.music.players.get(ctx.guild.id);

    if (!player) {
      ctx.sendMessage({ content: ':x: Não estou a tocar nada de momento!', flags: 1 << 6 });
      return;
    }

    const voiceChannelID = ctx.member?.voiceState.channelID;

    if (!voiceChannelID || (voiceChannelID && voiceChannelID !== player.voiceChannelId)) {
      ctx.sendMessage({ content: ':x: Precisas de estar no meu canal de voz para usar esse comando!', flags: 1 << 6 });
      return;
    }

    const voiceChannel = this.client.getChannel(voiceChannelID);

    if (voiceChannel.type !== 2) return;

    const stop = (dj: Boolean): void => {
      if (player.textChannelId) {
        const channel = this.client.getChannel(player.textChannelId);
        if (channel.type !== 0) return;

        if (player.lastPlayingMsgID) {
          channel.deleteMessage(player.lastPlayingMsgID).catch(() => { });
        }
      }
      player.destroy();

      ctx.sendMessage(dj ? ':stop_button:  Música parada por um DJ!' : ':stop_button: Música parada!');
    }

    const allQueueRequester = (user: User): boolean => {
      if (player.current?.requester !== user) return false;
      for (const m of player.queue) {
        if (m.requester !== user) return false;
      }
      return true;
    }

    const member = ctx.member
    if (!member) return;

    if (await this.client.music.hasDJRole(member)) {
      stop(true);
    } else {
      if (this.client.guildCache.get(ctx.guild.id)?.djRole) {
        if (allQueueRequester(ctx.author)
          || voiceChannel.voiceMembers.filter(m => !m.bot).length === 1
          || (ctx.member && voiceChannel.permissionsOf(ctx.member).has('voiceMoveMembers'))) {
          stop(false);
          return;
        }
        ctx.sendMessage({ content: ':x: Apenas quem requisitou todas as músicas da queue, alguém com o cargo DJ ou alguém com a permissão `Mover Membros` pode parar o player!', flags: 1 << 6 });
      } else stop(false);
    }
  }
}