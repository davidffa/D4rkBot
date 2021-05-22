import Command from '../../structures/Command';
import Client from '../../structures/Client';
import CommandContext from '../../structures/CommandContext';

import { Message } from 'eris';

export default class Skip extends Command {
  constructor(client: Client) {
    super(client, {
      name: 'skip',
      description: 'Pula a música atual.',
      category: 'Music',
      aliases: ['s', 'pular'],
      cooldown: 2,
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

    const skip = (dj: Boolean): void => {
      player.stop();

      if (!player.queue[0]) {
        if (player.textChannel) {
          const channel = this.client.getChannel(player.textChannel);
          if (channel.type !== 0) return;

          if (player.lastPlayingMsgID) {
            const msg = channel.messages.get(player.lastPlayingMsgID);
            if (msg) msg.delete();
          }
        }

        player.destroy();
        ctx.sendMessage(':bookmark_tabs: A lista de músicas acabou!');
        return;
      }
      ctx.sendMessage(dj ? ':fast_forward: Música pulada por um DJ!' : ':fast_forward: Música pulada!');
    }

    const member = ctx.msg.member
    if (!member) return;

    if (await this.client.music.hasDJRole(member)) {
      skip(true);
    } else {
      if (this.client.guildCache.get(ctx.msg.guildID as string)?.djRole) {
        if (ctx.author === player.queue.current?.requester || voiceChannel.voiceMembers.filter(m => !m.bot).length === 1) {
          skip(false);
          return;
        }
        ctx.sendMessage(':x: Apenas quem requisitou esta música ou alguém com o cargo DJ a pode pular!');
      } else skip(false);
    }
  }
}