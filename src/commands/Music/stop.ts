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

    const player = this.client.music.players.get(ctx.msg.guildID as string);

    if (!player) {
      ctx.sendMessage(':x: Não estou a tocar nada de momento!');
      return;
    }

    const voiceChannelID = ctx.msg.member?.voiceState.channelID;

    if (!voiceChannelID || (voiceChannelID && voiceChannelID !== player.voiceChannel)) {
      ctx.sendMessage(':x: Precisas de estar no meu canal de voz para usar esse comando!');
      return;
    }

    const voiceChannel = this.client.getChannel(voiceChannelID);

    if (voiceChannel.type !== 2) return;

    const stop = (dj: Boolean): void => {
      if (player.textChannel) {
        const channel = this.client.getChannel(player.textChannel);
        if (channel.type !== 0) return;

        if (player.lastPlayingMsgID) {
          const msg = channel.messages.get(player.lastPlayingMsgID);
          if (msg) msg.delete();
        }
      }
      player.destroy();

      ctx.sendMessage(dj ? ':stop_button:  Música parada por um DJ!' : ':stop_button: Música parada!');
    }

    const allQueueRequester = (user: User): boolean => {
      if (player.queue.current?.requester !== user) return false;
      for (const m of player.queue) {
        if (m.requester !== user) return false;
      }
      return true;
    }

    const member = ctx.msg.member
    if (!member) return;

    if (await this.client.music.hasDJRole(member)) {
      stop(true);
    } else {
      if (this.client.guildCache.get(ctx.msg.guildID as string)?.djRole) {
        if (allQueueRequester(ctx.author)
          || voiceChannel.voiceMembers.filter(m => !m.bot).length === 1
          || (ctx.msg.member && voiceChannel.permissionsOf(ctx.msg.member).has('voiceMoveMembers'))) {
          stop(false);
          return;
        }
        ctx.sendMessage(':x: Apenas quem requisitou todas as músicas da queue, alguém com o cargo DJ ou alguém com a permissão `Mover Membros` pode parar o player!');
      } else stop(false);
    }
  }
}