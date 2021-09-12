import Command from '../../structures/Command';
import Client from '../../structures/Client';
import CommandContext from '../../structures/CommandContext';

export default class Uptime extends Command {
  constructor(client: Client) {
    super(client, {
      name: 'uptime',
      description: 'Mostra à quanto tempo estou online.',
      category: 'Info',
      aliases: ['ontime'],
      cooldown: 5,
    });
  }

  execute(ctx: CommandContext): void {
    ctx.sendMessage(`<a:infinity:838759634361253929> Estou online há \`${this.client.utils.msToDate(process.uptime() * 1e3)}\``)
  }
}