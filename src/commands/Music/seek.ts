import Command from '../../structures/Command';
import Client from '../../structures/Client';
import CommandContext from '../../structures/CommandContext';

export default class Seek extends Command {
  static disabled = true;

  constructor(client: Client) {
    super(client, {
      name: 'seek',
      description: 'Avança para um tempo específico da música.',
      category: 'Music',
      cooldown: 5,
      args: 1,
      usage: '<Tempo>'
    });
  }

  async execute(ctx: CommandContext): Promise<void> {
    if (ctx.channel.type !== 0) return;

    const player = this.client.music.players.get(ctx.guild.id);

    if (!player || !player.current) {
      ctx.sendMessage({ content: ':x: Não estou a tocar nada de momento!', flags: 1 << 6 });
      return;
    }

    if (player.radio) {
      ctx.sendMessage({ content: ':x: Não podes usar este comando enquanto estiver a tocar uma rádio!', flags: 1 << 6 });
      return;
    }

    const voiceChannelID = ctx.member!.voiceState!.channelID;

    if (!voiceChannelID || (voiceChannelID && voiceChannelID !== player.voiceChannelId)) {
      ctx.sendMessage({ content: ':x: Precisas de estar no meu canal de voz para usar esse comando!', flags: 1 << 6 });
      return;
    }

    const voiceChannel = this.client.getChannel(voiceChannelID)!;

    if (voiceChannel.type !== 2) return;

    const member = ctx.member
    if (!member) return;

    const seek = (time: string): void => {
      if (Number(time) !== 0 && !Number(time.replace(/:/g, ''))) {
        ctx.sendMessage({ content: ':x: Tempo inválido! Tente no formato `ss` ou `hh:mm:ss`', flags: 1 << 6 });
        return;
      }

      if (!player.current?.duration) {
        ctx.sendMessage({ content: ':x: Não consegui ver o tempo da música.', flags: 1 << 6 });
        return;
      }

      let finalTime = 0;

      if (time.includes(':')) {
        const parts = time.split(':');

        if (parts.length > 3) {
          ctx.sendMessage({ content: `:x: O tempo tem de variar entre \`0 e ${player.current.duration / 1000}\` segundos`, flags: 1 << 6 })
          return;
        }

        const len = parts.length
        for (let i = 0; i < len; i++) {
          finalTime += Number(parts.pop()) * Math.pow(60, i);
        }
      }

      if ((finalTime && (finalTime < 0 || finalTime * 1000 > player.current.duration)) || Number(time) < 0 || Number(time) * 1000 > player.current.duration) {
        ctx.sendMessage({ content: `:x: O tempo tem de variar entre \`0 e ${player.current.duration / 1000}\` segundos`, flags: 1 << 6 })
        return;
      }

      player.seek(finalTime && (finalTime * 1000) || Number(time) * 1000);
      ctx.sendMessage(`:fast_forward: Tempo da música setado para \`${ctx.args[0]}\`.`);
    }

    const isDJ = await this.client.music.hasDJRole(member);

    if (this.client.guildCache.get(ctx.guild.id)?.djRole) {
      if (isDJ || ctx.author === player.current?.requester || voiceChannel.voiceMembers.filter(m => !m.bot).length === 1) {
        seek(ctx.args[0]);
        return;
      }
      ctx.sendMessage({ content: ':x: Apenas quem requisitou esta música ou alguém com o cargo DJ !', flags: 1 << 6 });
    } else seek(ctx.args[0]);
  }
}