import Command from '../../structures/Command';
import Client from '../../structures/Client';
import CommandContext from '../../structures/CommandContext';

import { readFileSync } from 'fs';
import { resolve } from 'path';

export default class Periodictable extends Command {
  constructor(client: Client) {
    super(client, {
      name: 'periodictable',
      description: 'Envia uma imagem da tabela periódica.',
      category: 'Others',
      aliases: ['tp', 'tabelaperiodica'],
      dm: true,
      cooldown: 4
    });
  }

  execute(ctx: CommandContext): void {
    if (ctx.channel.type === 0 && !ctx.channel.permissionsOf(this.client.user.id).has('attachFiles')) {
      ctx.sendMessage(':x: Preciso da permissão `Anexar Arquivos` para executar este comando');
      return;
    }

    const buffer = readFileSync(resolve(__dirname, '..', '..', 'assets', 'TP.png'));

    if (ctx.channel.type !== 0 || (ctx.channel.type === 0 && ctx.channel.permissionsOf(this.client.user.id).has('embedLinks'))) {
      const embed = new this.client.embed()
        .setTitle('Tabela Periódica')
        .setColor('RANDOM')
        .setImage('attachment://TP.png')
        .setTimestamp()
        .setFooter(`${ctx.author.username}#${ctx.author.discriminator}`, ctx.author.dynamicAvatarURL());

      ctx.sendMessage({ embed }, {
        name: 'TP.png',
        file: buffer
      });
    } else {
      ctx.sendMessage('Tabela Periódica!', {
        name: 'Tabela Periódica.png',
        file: buffer
      });
    }
  }
}