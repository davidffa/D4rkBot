import Command from '../../structures/Command';
import Client from '../../structures/Client';
import CommandContext from '../../structures/CommandContext';

export default class Volume extends Command {
  constructor(client: Client) {
    super(client, {
      name: 'volume',
      description: 'Altera o volume da música.',
      category: 'Music',
      aliases: ['vol'],
      cooldown: 4,
    });
  }

  async execute(ctx: CommandContext): Promise<void> {
    if (ctx.channel.type !== 0) return;

    const player = this.client.music.players.get(ctx.guild.id);

    if (!player || !player.current) {
      ctx.sendMessage({ content: ':x: Não estou a tocar nada de momento!', flags: 1 << 6 });
      return;
    }

    if (!ctx.args.length) {
      ctx.sendMessage(`:speaker: Volume atual: \`${player.volume}\``);
      return;
    }

    const voiceChannelID = ctx.member?.voiceState?.channelID;

    if (!voiceChannelID || (voiceChannelID && voiceChannelID !== player.voiceChannelId)) {
      ctx.sendMessage({ content: ':x: Precisas de estar no meu canal de voz para usar esse comando!', flags: 1 << 6 });
      return;
    }

    const voiceChannel = this.client.getChannel(voiceChannelID)!;

    if (voiceChannel.type !== 2) return;

    const member = ctx.member;
    if (!member) return;

    const setVolume = (vol: string): void => {
      if (!Number(vol)) {
        ctx.sendMessage({ content: ':x: Valor do volume inválido!', flags: 1 << 6 });
        return;
      }

      if (Number(vol) <= 0 || Number(vol) > 200) {
        ctx.sendMessage({ content: ':x: O volume apenas pode variar entre 1 e 200', flags: 1 << 6 });
        return;
      }

      player.filters.setVolume(Number(vol))
      ctx.sendMessage(`:speaker: Volume da música setado para \`${vol}\``);
    }

    const isDJ = await this.client.music.hasDJRole(member);

    if (this.client.guildCache.get(ctx.guild.id)?.djRole) {
      if (isDJ || ctx.author === player.current?.requester || voiceChannel.voiceMembers.filter(m => !m.bot).length === 1) {
        setVolume(ctx.args[0]);
        return;
      }
      ctx.sendMessage({ content: ':x: Apenas quem requisitou esta música ou alguém com o cargo DJ pode alterar o volume!', flags: 1 << 6 });
    } else setVolume(ctx.args[0]);
  }
}
