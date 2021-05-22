import Command from '../../structures/Command';
import Client from '../../structures/Client';
import CommandContext from '../../structures/CommandContext';

import figlet from 'figlet';

export default class Ascii extends Command {
  constructor(client: Client) {
    super(client, {
      name: 'ascii',
      description: 'Torna uma frase numa ascii art.',
      args: 1,
      usage: '<Texto>',
      category: 'Others',
      dm: true,
      aliases: ['asciiart'],
      cooldown: 3
    });
  }

  execute(ctx: CommandContext): void {
    const text = ctx.args.join(' ');

    if (text.length > 15) {
      ctx.sendMessage(':x: Máximo de 15 caracteres permitido!');
      return;
    }

    figlet(text, (err, data) => {
      if (err || !data) {
        ctx.sendMessage(':x: Conteúdo inválido.');
        return;
      }

      ctx.sendMessage(`\`\`\`\n${data}\`\`\``);
    })
  }
}