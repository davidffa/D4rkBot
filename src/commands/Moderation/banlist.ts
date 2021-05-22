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
    if (ctx.channel.type !== 0 || !ctx.msg.member || !ctx.guild) return;

    if (!ctx.msg.member.permissions.has('banMembers')) {
      ctx.sendMessage(':x: Não tens permissão para ver a lista de membros banidos.');
      return;
    }

    if (!ctx.guild.members.get(this.client.user.id)?.permissions.has('banMembers')) {
      ctx.sendMessage(':x: Não tenho permissão para ver a lista de membros banidos!');
      return;
    }

    let msg = '';

    const bans = await ctx.guild.getBans();

    if (!bans.length) {
      ctx.sendMessage(':x: Este servidor não tem membros banidos!');
      return;
    }

    bans.forEach(ban => {
      msg += `\`${ban.user.username}#${ban.user.discriminator}\`, `;
    });

    ctx.sendMessage(`:bookmark_tabs: Lista de membros banidos: \n${msg.slice(0, 1800)}${msg.length > 1800 ? '...' : ''}`);
  }
}