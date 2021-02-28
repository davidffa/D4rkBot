import Command from '../../structures/Command';
import Client from '../../structures/Client';

import { Message } from 'eris';

import fetch from 'node-fetch';
import cio from 'cheerio';

export default class Currency extends Command {
    constructor(client: Client) {
        super(client, {
            name: 'currency',
            description: 'Conversor de moeda',
            args: 3,
            usage: '<de> <para> <valor>',
            category: 'Others',
            dm: true,
            aliases: ['moeda', 'curr', 'conversormoeda', 'currconverter'],
            cooldown: 3
        });
    }

    async execute(message: Message, args: Array<string>): Promise<void> {
        if (message.channel.type === 0 && !message.channel.permissionsOf(this.client.user.id).has('embedLinks')) {
            message.channel.createMessage(':x: Preciso da permissão `EMBED_LINKS` para executar este comando');
            return;
        }

        if (isNaN(parseFloat(args[2]))) {
            message.channel.createMessage(':x: Valor inválido.');
            return; 
        }

        args[0] = args[0].toUpperCase();
        args[1] = args[1].toUpperCase();

        const res = await fetch(`https://www.x-rates.com/calculator/?from=${args[0]}&to=${args[1]}&amount=${args[2]}`).then(res => res.text());

        const $ = cio.load(res);

        const value = $('span[class="ccOutputRslt"]').text();

        if (value.endsWith('---')) {
            message.channel.createMessage(':x: Formato da moeda inválido! Tente `USD, EUR, BRL, ...`');
            return;
        }

        const embed = new this.client.embed()
            .setColor('RANDOM')
            .setDescription(`Fonte: [x-rates](https://www.x-rates.com/calculator/?from=${args[0]}&to=${args[1]}&amount=${args[2]})`)
            .setTitle('Conversor de Moeda')
            .addField(`:moneybag: Valor de origem: (${args[0]})`, `\`\`\`\n${args[2]}\`\`\``)
            .addField(`:moneybag: Valor convertido: (${args[1]})`, `\`\`\`\n${value.split(' ')[0]}\`\`\``)
            .setTimestamp()
            .setFooter(`${message.author.username}#${message.author.discriminator}`, message.author.dynamicAvatarURL());

        message.channel.createMessage({ embed });
    }
}