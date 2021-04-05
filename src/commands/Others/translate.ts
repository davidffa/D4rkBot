import Command from '../../structures/Command';
import Client from '../../structures/Client';

import { Message } from 'eris';

import translate from '@iamtraction/google-translate';

export default class Translate extends Command {
  constructor(client: Client) {
    super(client, {
      name: 'translate',
      description: 'Traduz uma frase ou palavra',
      args: 2,
      usage: '<para> <texto>',
      category: 'Others',
      aliases: ['traduzir'],
      dm: true,
      cooldown: 3
    });
  }

  async execute(message: Message, args: Array<string>): Promise<void> {
    if (message.channel.type === 0 && !message.channel.permissionsOf(this.client.user.id).has('embedLinks')) {
      message.channel.createMessage(':x: Preciso da permissão `Anexar Links` para executar este comando');
      return;
    }

    const text = args.slice(1).join(' ');

    try {
      const res = await translate(text, {
        to: args[0]
      });

      const embed = new this.client.embed()
        .setColor('RANDOM')
        .setTitle('Tradutor')
        .addField(`:bookmark: Texto de origem: (${res.from.language.iso})`, `\`\`\`${text}\`\`\``)
        .addField(`:book: Texto traduzido: (${args[0]})`, `\`\`\`${res.text ? res.text : ''}\`\`\``)
        .setTimestamp()
        .setFooter(`${message.author.username}#${message.author.discriminator}`, message.author.dynamicAvatarURL());

      message.channel.createMessage({ embed });
    } catch (err) {
      if (err.message.startsWith('The language') && err.message.endsWith('is not supported.')) {
        message.channel.createMessage(':x: Linguagem não suportada! Tente `en, pt, fr, ...`');
        return;
      }
      message.channel.createMessage(':x: Ocorreu um erro!');
    }
  }
}