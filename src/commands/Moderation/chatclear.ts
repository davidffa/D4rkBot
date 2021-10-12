import Command from '../../structures/Command';
import Client from '../../structures/Client';
import CommandContext from '../../structures/CommandContext';
import { Message } from 'eris';

export default class Chatclear extends Command {
  constructor(client: Client) {
    super(client, {
      name: 'chatclear',
      description: 'Limpa mensagens num canal de texto.',
      category: 'Moderation',
      cooldown: 4,
      usage: '<Número de mensagens>',
      aliases: ['cc', 'limparchat', 'purge', 'clear'],
      args: 1
    });
  }

  async execute(ctx: CommandContext): Promise<void> {
    if (ctx.channel.type !== 0) return;

    const channel = ctx.channel;

    if (!channel.permissionsOf(ctx.author.id).has('manageMessages')) {
      ctx.sendMessage(':x: Não tens permissão para apagar mensagens.');
      return;
    }

    if (!channel.permissionsOf(this.client.user.id).has('manageMessages')) {
      ctx.sendMessage(':x: Não tenho permissão para apagar mensagens!');
      return;
    }

    if (!parseInt(ctx.args[0])) {
      ctx.sendMessage(':x: Número inválido!');
      return;
    }

    if (parseInt(ctx.args[0]) > 1e3) {
      ctx.sendMessage({ content: ':x: Só podes apagar 1000 mensagens de cada vez!', flags: 1 << 6 });
      return;
    }

    channel.purge({ limit: parseInt(ctx.args[0]) + 1 }).then(async msgs => {
      if (parseInt(ctx.args[0]) + 1 !== msgs) {
        const msg = await ctx.sendMessage(`<a:verificado:803678585008816198> Limpas \`${msgs - 1}\` mensagens\n:warning: Não consegui apagar todas as \`${parseInt(ctx.args[0])}\` mensagens`, true) as Message;
        setTimeout(() => {
          msg.delete().catch(() => { });
        }, 7e3);
        return;
      }

      const msg = await ctx.sendMessage(`<a:verificado:803678585008816198> Limpas \`${msgs - 1}\` mensagens`, true) as Message;
      setTimeout(() => {
        msg.delete().catch(() => { });
      }, 7e3);
    });
  }
}