import Command from '../../structures/Command';
import Client from '../../structures/Client';
import CommandContext from '../../structures/CommandContext';

export default class Shuffle extends Command {
  constructor(client: Client) {
    super(client, {
      name: 'shuffle',
      description: 'Embaralha a lista de músicas.',
      category: 'Music',
      aliases: ['baralhar', 'embaralhar'],
      cooldown: 8,
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

    const member = ctx.msg.member;
    if (!member) return;
    if (player.radio) {
      ctx.sendMessage(':x: Não podes usar este comando enquanto estiver a tocar uma rádio!');
      return;
    }

    const shuffle = (): void => {
      if (!player.queue.length) {
        ctx.sendMessage(':x: A queue está vazia!');
        return;
      }
      player.queue.shuffle();

      ctx.sendMessage('<a:disco:803678643661832233> Lista de músicas embaralhada!');
    }

    const isDJ = await this.client.music.hasDJRole(member);

    if (this.client.guildCache.get(ctx.msg.guildID as string)?.djRole) {
      if (isDJ || voiceChannel.voiceMembers.filter(m => !m.bot).length === 1) {
        shuffle();
        return;
      }
      ctx.sendMessage(':x: Apenas alguém com o cargo DJ pode embaralhar a lista de músicas!');
    } else shuffle();
  }
}