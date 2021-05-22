import Command from '../../structures/Command';
import Client from '../../structures/Client';
import CommandContext from '../../structures/CommandContext';

export default class Remove extends Command {
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

    const remove = (pos: number): void => {
      if (!player.queue.length) {
        ctx.sendMessage(':x: Não há músicas na queue');
        return;
      }

      if (!pos || pos <= 0 || pos > player.queue.length) {
        ctx.sendMessage(`:x: Número inválido! Tente um número entre 1 e ${player.queue.length}`);
        return;
      }

      player.queue.remove(pos - 1);
      ctx.sendMessage(`<a:disco:803678643661832233> Música na posição ${pos} removida!`);
    }

    const isDJ = await this.client.music.hasDJRole(member);

    if (this.client.guildCache.get(ctx.msg.guildID as string)?.djRole) {
      if (!player.queue.length) {
        ctx.sendMessage(':x: Não há músicas na queue');
        return;
      }
      if (isDJ || (player.queue[parseInt(ctx.args[0]) - 1] && ctx.author === player.queue[parseInt(ctx.args[0]) - 1].requester) || voiceChannel.voiceMembers.filter(m => !m.bot).length === 1) {
        remove(parseInt(ctx.args[0]));
        return;
      }
      ctx.sendMessage(':x: Apenas quem requisitou essa música ou alguém com o cargo DJ pode remover a música da queue!');
    } else remove(parseInt(ctx.args[0]));
  }
}