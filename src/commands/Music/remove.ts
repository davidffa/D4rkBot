import Command from '../../structures/Command';
import Client from '../../structures/Client';
import CommandContext from '../../structures/CommandContext';
import { TrackQueue } from '../../structures/TrackQueue';

export default class Remove extends Command {
  static disabled = true;

  constructor(client: Client) {
    super(client, {
      name: 'remove',
      description: 'Remove uma música da queue.',
      category: 'Music',
      aliases: ['r'],
      usage: '<Posição>',
      cooldown: 4,
      args: 1
    });
  }

  async execute(ctx: CommandContext): Promise<void> {
    if (ctx.channel.type !== 0) return;

    const player = this.client.music.players.get(ctx.guild.id);

    if (!player || !player.current) {
      ctx.sendMessage({ content: ':x: Não estou a tocar nada de momento!', flags: 1 << 6 });
      return;
    }

    const voiceChannelID = ctx.member?.voiceState!.channelID;

    if (!voiceChannelID || (voiceChannelID && voiceChannelID !== player.voiceChannelId)) {
      ctx.sendMessage({ content: ':x: Precisas de estar no meu canal de voz para usar esse comando!', flags: 1 << 6 });
      return;
    }

    const voiceChannel = this.client.getChannel(voiceChannelID)!;

    if (voiceChannel.type !== 2) return;

    const member = ctx.member;
    if (!member) return;

    const remove = (pos: number): void => {
      if (!player.queue.size) {
        ctx.sendMessage({ content: ':x: Não há músicas na queue', flags: 1 << 6 });
        return;
      }

      if (!pos || pos <= 0 || pos > player.queue.size) {
        ctx.sendMessage({ content: `:x: Número inválido! Tente um número entre 1 e ${player.queue.size}`, flags: 1 << 6 });
        return;
      }

      (player.queue as TrackQueue).removeTrackAt(pos - 1);
      ctx.sendMessage(`<a:disco:803678643661832233> Música na posição ${pos} removida!`);
    }

    const isDJ = await this.client.music.hasDJRole(member);

    if (this.client.guildCache.get(ctx.guild.id)?.djRole) {
      if (!player.queue.size) {
        ctx.sendMessage({ content: ':x: Não há músicas na queue', flags: 1 << 6 });
        return;
      }

      const targetTrack = (player.queue as TrackQueue).getTrackAt(parseInt(ctx.args[0]) - 1);

      if (isDJ || (targetTrack && ctx.author === targetTrack.requester) || voiceChannel.voiceMembers.filter(m => !m.bot).length === 1) {
        remove(parseInt(ctx.args[0]));
        return;
      }
      ctx.sendMessage({ content: ':x: Apenas quem requisitou essa música ou alguém com o cargo DJ pode remover a música da queue!', flags: 1 << 6 });
    } else remove(parseInt(ctx.args[0]));
  }
}