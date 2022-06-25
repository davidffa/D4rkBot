import Command from '../../structures/Command';
import Client from '../../structures/Client';
import CommandContext from '../../structures/CommandContext';
import { TrackQueue } from '../../structures/TrackQueue';

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

    const player = this.client.music.players.get(ctx.guild.id);

    if (!player || !player.current) {
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

    const skip = (dj: Boolean): void => {
      player.skip();

      if (!(player.queue as TrackQueue).peek() && !player.trackRepeat && !player.queueRepeat) {
        const channel = this.client.getChannel(player.textChannelId!);
        if (channel.type !== 0) return;

        if (player.lastPlayingMsgID) {
          channel.deleteMessage(player.lastPlayingMsgID).catch(() => { });
        }

        player.destroy();
        ctx.sendMessage(':bookmark_tabs: A lista de músicas acabou!');
        return;
      }
      ctx.sendMessage(dj ? ':fast_forward: Música pulada por um DJ!' : ':fast_forward: Música pulada!');
    }

    const member = ctx.member
    if (!member) return;

    if (await this.client.music.hasDJRole(member)) {
      skip(true);
    } else {
      if (this.client.guildCache.get(ctx.guild.id)?.djRole) {
        if (ctx.author === player.current?.requester || voiceChannel.voiceMembers.filter(m => !m.bot).length === 1) {
          skip(false);
          return;
        }
        ctx.sendMessage({ content: ':x: Apenas quem requisitou esta música ou alguém com o cargo DJ a pode pular!', flags: 1 << 6 });
      } else skip(false);
    }
  }
}