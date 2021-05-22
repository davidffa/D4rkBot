import Command from '../../structures/Command';
import Client from '../../structures/Client';
import CommandContext from '../../structures/CommandContext';

export default class Pause extends Command {
  constructor(client: Client) {
    super(client, {
      name: 'pause',
      description: 'Pausa a música atual.',
      category: 'Music',
      aliases: ['pausa'],
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

    const member = ctx.msg.member;
    if (!member) return;

    const pause = (): void => {
      if (player.paused) {
        ctx.sendMessage(':x: A música já está pausada!');
        return;
      }

      player.pause(true);
      ctx.sendMessage(':pause_button: Música pausada!');
    }

    const isDJ = await this.client.music.hasDJRole(member)

    if (this.client.guildCache.get(ctx.msg.guildID as string)?.djRole) {
      if (isDJ || voiceChannel.voiceMembers.filter(m => !m.bot).length === 1) {
        pause();
        return;
      }
      ctx.sendMessage(':x: Apenas alguém com o cargo DJ pode pausar a música!');
    } else pause();
  }
}