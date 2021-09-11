import Command from '../../structures/Command';
import Client from '../../structures/Client';
import CommandContext from '../../structures/CommandContext';

export default class Lock extends Command {
  constructor(client: Client) {
    super(client, {
      name: 'lock',
      description: 'Proibe o envio de mensagens do cargo @everyone no canal em que o comando foi executado.',
      category: 'Moderation',
      cooldown: 4,
      aliases: ['lockchat', 'lockchannel'],
      usage: '[motivo]'
    });
  }

  async execute(ctx: CommandContext): Promise<void> {
    if (ctx.channel.type !== 0) return;

    const channel = ctx.channel;

    if (!channel.permissionsOf(ctx.author.id).has('manageChannels')) {
      ctx.sendMessage({ content: ':x: Não tens permissão para alterar as permissões deste canal.', flags: 1 << 6 });
      return;
    }

    if (!channel.permissionsOf(this.client.user.id).has('manageChannels')) {
      ctx.sendMessage({ content: ':x: Não tenho permissão para alterar as permissões deste canal!', flags: 1 << 6 });
      return;
    }

    const permissions = channel.permissionOverwrites.get(ctx.guild.id);

    if (permissions && (permissions.deny & 1n << 11n) == 1n << 11n) {
      ctx.sendMessage({ content: ':x: O canal já está bloqueado!', flags: 1 << 6 });
      return;
    }

    const allow = permissions?.allow ?? 0n;
    const deny = permissions?.deny ?? 0n;

    await ctx.sendMessage(':lock: Canal bloqueado!');
    channel.editPermission(ctx.guild.id, allow & ~(1n << 11n), deny | (1n << 11n), 0, 'Lock cmd' || ctx.args.join(' ').slice(0, 50));
  }
}