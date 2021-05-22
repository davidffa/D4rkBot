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

    const player = this.client.music.players.get(ctx.msg.guildID as string);

    if (!player) {
      ctx.sendMessage(':x: Não estou a tocar nada de momento!');
      return;
    }

    if (!ctx.args.length) {
      ctx.sendMessage(`:speaker: Volume atual: \`${player.volume}\``);
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

    const setVolume = (vol: string): void => {
      if (!Number(vol)) {
        ctx.sendMessage(':x: Valor do volume inválido!');
        return;
      }

      if (Number(vol) <= 0 || Number(vol) > 200) {
        ctx.sendMessage(':x: O volume apenas pode variar entre 1 e 200');
        return;
      }

      player.setVolume(Number(vol))
      ctx.sendMessage(`:speaker: Volume da música setado para \`${vol}\``);
    }

    const isDJ = await this.client.music.hasDJRole(member);

    if (this.client.guildCache.get(ctx.msg.guildID as string)?.djRole) {
      if (isDJ || ctx.author === player.queue.current?.requester || voiceChannel.voiceMembers.filter(m => !m.bot).length === 1) {
        setVolume(ctx.args[0]);
        return;
      }
      ctx.sendMessage(':x: Apenas quem requisitou esta música ou alguém com o cargo DJ pode alterar o volume!');
    } else setVolume(ctx.args[0]);
  }
}