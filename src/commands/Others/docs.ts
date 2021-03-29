import Command from '../../structures/Command';
import Client from '../../structures/Client';

import { Message } from 'eris';

import fetch from 'node-fetch';

export default class Docs extends Command {
  constructor(client: Client) {
    super(client, {
      name: 'docs',
      description: 'Procura algo na documentação do Eris',
      args: 1,
      usage: '<Procura>',
      category: 'Others',
      dm: true,
      cooldown: 3
    });
  }

  async execute(message: Message, args: Array<string>): Promise<void> {
    if (message.channel.type === 0 && !message.channel.permissionsOf(this.client.user.id).has('embedLinks')) {
      message.channel.createMessage(':x: Preciso da permissão `Anexar Links` para executar este comando');
      return;
    }

    const res = await fetch(`${process.env.ERISDOCSAPIURL}/docs?token=${process.env.ERISDOCSAPITOKEN}&search=${encodeURIComponent(args.join(' '))}`).then(r => r.json());

    if (res.error) {
      message.channel.createMessage(':x: Nada encontrado nas docs!');
      return;
    }

    message.channel.createMessage({ embed: res });
  }
}