import Command from '../../structures/Command';
import Client from '../../structures/Client';
import CommandContext from '../../structures/CommandContext';

export default class Unban extends Command {
  constructor(client: Client) {
    super(client, {
      name: 'unban',
      description: 'Tira o ban a alguém.',
      category: 'Moderation',
      cooldown: 4,
      args: 1,
      usage: '<user/ID>',
      aliases: ['removeban']
    });
  }

  async execute(ctx: CommandContext): Promise<void> {
    if (ctx.channel.type !== 0 || !ctx.msg.member || !ctx.guild) return;

    if (!ctx.msg.member.permissions.has('banMembers')) {
      ctx.sendMessage(':x: Não tens permissão para desbanir membros.');
      return;
    }

    if (!ctx.guild.members.get(this.client.user.id)?.permissions.has('banMembers')) {
      ctx.sendMessage(':x: Não tenho permissão para desbanir membros!');
      return;
    }

    const bans = await ctx.guild.getBans();

    if (!bans.length) {
      ctx.sendMessage(':x: Este servidor não tem membros banidos!');
      return;
    }

    const member = bans.find(m => m.user.id === ctx.args[0] || m.user.username.toLowerCase().startsWith(ctx.args.join(' ').toLowerCase()));

    if (!member) {
      ctx.sendMessage(':x: Membro não encontrado!');
      return;
    }

    ctx.guild.unbanMember(member.user.id).then(() => {
      ctx.sendMessage(`<a:verificado:803678585008816198> Desbanis-te o \`${member.user.username}#${member.user.discriminator}\``);
    }).catch(() => {
      ctx.sendMessage(':x: Ocorreu um erro ao tentar desbanir esse membro.');
    });
  }
}