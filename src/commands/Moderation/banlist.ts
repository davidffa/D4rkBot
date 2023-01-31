import Command from '../../structures/Command';
import Client from '../../structures/Client';
import CommandContext from '../../structures/CommandContext';

export default class Banlist extends Command {
  constructor(client: Client) {
    super(client, {
      name: 'banlist',
      description: 'Lista de bans.',
      category: 'Moderation',
      cooldown: 10
    });
  }

  async execute(ctx: CommandContext): Promise<void> {
    if (ctx.channel.type !== 0 || !ctx.member || !ctx.guild) return;

    if (!ctx.member.permissions.has('BAN_MEMBERS')) {
      ctx.sendMessage({ content: ':x: Não tens permissão para ver a lista de membros banidos.', flags: 1 << 6 });
      return;
    }

    if (!ctx.guild.members.get(this.client.user.id)?.permissions.has('BAN_MEMBERS')) {
      ctx.sendMessage({ content: ':x: Não tenho permissão para ver a lista de membros banidos!', flags: 1 << 6 });
      return;
    }

    let msg = '';

    const bans = await ctx.guild.getBans();

    if (!bans.length) {
      ctx.sendMessage({ content: ':x: Este servidor não tem membros banidos!', flags: 1 << 6 });
      return;
    }

    bans.forEach(ban => {
      msg += `\`${ban.user.username}#${ban.user.discriminator}\`, `;
    });

    ctx.sendMessage(`:bookmark_tabs: Lista de membros banidos: \n${msg.slice(0, 1800)}${msg.length > 1800 ? '...' : ''}`);
  }
}