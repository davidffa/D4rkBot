import Command from '../../structures/Command';
import Client from '../../structures/Client';

import { Message } from 'eris';

import { readFileSync } from 'fs';
import { resolve } from 'path';

class Periodictable extends Command {
    constructor(client: Client) {
        super(client, {
            name: 'periodictable',
            description: 'Envia uma imagem da tabela periódica',
            category: 'Others',
            aliases: ['tp', 'tabelaperiodica'],
            dm: true,
            cooldown: 4
        });
    }

    execute(message: Message, args: Array<string>): void {
        if (message.channel.type === 0 && !message.channel.permissionsOf(this.client.user.id).has('attachFiles')) {
            message.channel.createMessage(':x: Preciso da permissão `ATTACH_FILES` para executar este comando');
            return;
        }

        const buffer = readFileSync(resolve(__dirname, '..', '..', 'assets', 'TP.png'));
        
        if (message.channel.type !== 0 || (message.channel.type === 0 && message.channel.permissionsOf(this.client.user.id).has('embedLinks'))) {
            const embed = new this.client.embed()
                .setTitle('Tabela Periódica')
                .setColor('RANDOM')
                .setImage('attachment://TP.png')
                .setTimestamp()
                .setFooter(`${message.author.username}#${message.author.discriminator}`, message.author.dynamicAvatarURL());

            message.channel.createMessage({ embed }, {
                name: 'TP.png',
                file: buffer
            });
        }else {
            message.channel.createMessage('Tabela Periódica!', {
                name: 'Tabela Periódica.png',
                file: buffer
            });
        }
    }
}

module.exports = Periodictable;