import Command from '../../structures/Command';
import Client from '../../structures/Client';

import { Message } from 'eris';

import figlet from 'figlet';

export default class Ascii extends Command {
  constructor(client: Client) {
    super(client, {
      name: 'ascii',
      description: 'Torna uma frase numa ascii art',
      args: 1,
      usage: '<Texto>',
      category: 'Others',
      dm: true,
      aliases: ['asciiart'],
      cooldown: 3
    });
  }

  execute(message: Message, args: Array<string>): void {
    const text = args.join(' ');

    if (text.length > 15) {
      message.channel.createMessage(':x: Máximo de 15 caracteres permitido!');
      return;
    }

    figlet(text, (err, data) => {
      if (err || !data) {
        message.channel.createMessage(':x: Conteúdo inválido.');
        return;
      }

      message.channel.createMessage(`\`\`\`\n${data}\`\`\``);
    })
  }
}