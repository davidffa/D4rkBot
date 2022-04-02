import Command from '../../structures/Command';
import Client from '../../structures/Client';
import CommandContext from '../../structures/CommandContext';

export default class Docs extends Command {
  constructor(client: Client) {
    super(client, {
      name: 'docs',
      description: 'Procura algo na documentação do Eris.',
      args: 1,
      usage: '<Procura>',
      category: 'Others',
      cooldown: 3
    });
  }

  async execute(ctx: CommandContext): Promise<void> {
    if (ctx.channel.type === 0 && !ctx.channel.permissionsOf(this.client.user.id).has('embedLinks')) {
      ctx.sendMessage({ content: ':x: Preciso da permissão `Anexar Links` para executar este comando', flags: 1 << 6 });
      return;
    }

    const res = await this.client.request(`${process.env.ERISDOCSAPIURL}/docs?search=${encodeURIComponent(ctx.args.join(' '))}`).then(r => r.body.json());

    if (res.error) {
      ctx.sendMessage({ content: ':x: Nada encontrado nas docs!', flags: 1 << 6 });
      return;
    }

    ctx.sendMessage({ embeds: [res] });
  }
}