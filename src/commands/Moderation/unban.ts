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
    if (ctx.channel.type !== 0 || !ctx.member || !ctx.guild) return;

    if (!ctx.member.permissions.has('banMembers')) {
      ctx.sendMessage({ content: ':x: Não tens permissão para desbanir membros.', flags: 1 << 6 });
      return;
    }

    if (!ctx.guild.members.get(this.client.user.id)?.permissions.has('banMembers')) {
      ctx.sendMessage({ content: ':x: Não tenho permissão para desbanir membros!', flags: 1 << 6 });
      return;
    }

    const bans = await ctx.guild.getBans();

    if (!bans.length) {
      ctx.sendMessage({ content: ':x: Este servidor não tem membros banidos!', flags: 1 << 6 });
      return;
    }

    const member = bans.find(m => m.user.id === (ctx.targetUsers?.[0]?.id ?? ctx.args[0]) || m.user.username.toLowerCase().startsWith(ctx.args.join(' ').toLowerCase()));

    if (!member) {
      ctx.sendMessage({ content: ':x: Membro não encontrado!', flags: 1 << 6 });
      return;
    }

    ctx.guild.unbanMember(member.user.id).then(() => {
      ctx.sendMessage(`<a:verificado:803678585008816198> Desbanis-te o \`${member.user.username}#${member.user.discriminator}\``);
    }).catch(() => {
      ctx.sendMessage({ content: ':x: Ocorreu um erro ao tentar desbanir esse membro.', flags: 1 << 6 });
    });
  }
}