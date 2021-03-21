import Command from '../../structures/Command';
import Client from '../../structures/Client';

import { Message } from 'eris';

import moment from 'moment';
moment.locale('pt');

export default class Discriminator extends Command {
  constructor(client: Client) {
    super(client, {
      name: 'discriminator',
      description: 'Mostra todas as pessoas no servidor com um determinado discriminator',
      category: 'Info',
      aliases: ['discrimin'],
      cooldown: 5,
      args: 1,
      usage: '<discriminator>'
    });
  }

  execute(message: Message, args: string[]) {
    if (message.channel.type !== 0) return;

    const discriminRegex = /^[0-9]{4}$/g;
    const discrimin = args.join('').replace('#', '');

    if (!discriminRegex.test(discrimin)) {
      message.channel.createMessage(':x: Discriminator inválido!');
      return;
    }

    const members = message.channel.guild.members.filter(m => m.discriminator === discrimin).map(m => `${m.username}#${m.discriminator}`);

    if (!members.length) {
      message.channel.createMessage(':x: Não encontrei nenhum membro com esse discriminator!');
      return;
    }

    message.channel.createMessage(`<:chat:804050576647913522> Membros com o discriminator **${discrimin}**:\n\`\`\`\n${members.slice(0, 20).join('\n')}${members.length > 20 ? `\nMais ${members.length - 20} resultados encontrados` : ''}\`\`\``);
  }
}
