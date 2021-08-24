import Command from '../../structures/Command';
import Client from '../../structures/Client';
import CommandContext from '../../structures/CommandContext';

import fetch from 'node-fetch';

export default class Docs extends Command {
  constructor(client: Client) {
    super(client, {
      name: 'docs',
      description: 'Procura algo na documentação do Eris.',
      args: 1,
      usage: '<Procura>',
      category: 'Others',
      dm: true,
      cooldown: 3
    });
  }

  async execute(ctx: CommandContext): Promise<void> {
    if (ctx.channel.type === 0 && !ctx.channel.permissionsOf(this.client.user.id).has('embedLinks')) {
      ctx.sendMessage(':x: Preciso da permissão `Anexar Links` para executar este comando');
      return;
    }

    const res = await fetch(`${process.env.ERISDOCSAPIURL}/docs?search=${encodeURIComponent(ctx.args.join(' '))}`).then(r => r.json());

    if (res.error) {
      ctx.sendMessage(':x: Nada encontrado nas docs!');
      return;
    }

    ctx.sendMessage({ embed: res });
  }
}