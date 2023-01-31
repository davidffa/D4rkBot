import Command from '../../structures/Command';
import Client from '../../structures/Client';
import CommandContext from '../../structures/CommandContext';

import { readFileSync } from 'fs';
import { resolve } from 'path';
import { dynamicAvatar } from '../../utils/dynamicAvatar';

export default class Periodictable extends Command {
  constructor(client: Client) {
    super(client, {
      name: 'periodictable',
      description: 'Envia uma imagem da tabela periódica.',
      category: 'Others',
      aliases: ['tp', 'tabelaperiodica'],
      cooldown: 4
    });
  }

  execute(ctx: CommandContext): void {
    if (ctx.channel.type === 0 && !ctx.channel.permissionsOf(this.client.user.id).has('ATTACH_FILES')) {
      ctx.sendMessage({ content: ':x: Preciso da permissão `Anexar Arquivos` para executar este comando', flags: 1 << 6 });
      return;
    }

    const buffer = readFileSync(resolve(__dirname, '..', '..', 'assets', 'TP.png'));

    if (ctx.channel.type !== 0 || (ctx.channel.type === 0 && ctx.channel.permissionsOf(this.client.user.id).has('EMBED_LINKS'))) {
      const embed = new this.client.embed()
        .setTitle('Tabela Periódica')
        .setColor('RANDOM')
        .setImage('attachment://TP.png')
        .setTimestamp()
        .setFooter(`${ctx.author.username}#${ctx.author.discriminator}`, dynamicAvatar(ctx.author));

      ctx.sendMessage({
        embeds: [embed],
        files: [
          {
            name: 'TP.png',
            contents: buffer
          }
        ]
      });
    } else {
      ctx.sendMessage({
        content: 'Tabela Periódica!',
        files: [
          {
            name: 'Tabela Periódica.png',
            contents: buffer
          }
        ]
      });
    }
  }
}