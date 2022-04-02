import Command from '../../structures/Command';
import Client from '../../structures/Client';
import CommandContext from '../../structures/CommandContext';

export default class Level extends Command {
  constructor(client: Client) {
    super(client, {
      name: 'level',
      description: 'Vê o teu nível ou o nível de alguém no servidor.',
      usage: '[membro]',
      category: 'Others',
      cooldown: 5
    });
  }

  async execute(ctx: CommandContext): Promise<void> {
    if (ctx.channel.type !== 0) return;

    if (ctx.channel.permissionsOf(this.client.user.id).has('embedLinks')) {
      ctx.sendMessage({ content: ':x: Preciso da permissão `Anexar Links` para executar este comando', flags: 1 << 6 });
      return;
    }

    if (ctx.channel.permissionsOf(this.client.user.id).has('attachFiles')) {
      ctx.sendMessage({ content: ':x: Preciso da permissão `Anexar Arquivos` para executar este comando', flags: 1 << 6 });
      return;
    }

    if (this.client.guildCache.get(ctx.guild.id)?.levelEnabled === false) {
      ctx.sendMessage({ content: ':x: O sistema de níveis está desativado neste servidor!', flags: 1 << 6 });
      return;
    }
  }
}