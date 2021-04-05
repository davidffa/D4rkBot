import Command from '../../structures/Command';
import Client from '../../structures/Client';

import { Message } from 'eris';

import fetch from 'node-fetch';

export default class Isitup extends Command {
    constructor(client: Client) {
        super(client, {
            name: 'isitup',
            description: 'Vê se um site está online',
            args: 1,
            usage: '<URL>',
            category: 'Others',
            dm: true,
            cooldown: 4
        });
    }

    async execute(message: Message, args: Array<string>): Promise<void> {
        if (message.channel.type === 0 && !message.channel.permissionsOf(this.client.user.id).has('embedLinks')) {
            message.channel.createMessage(':x: Preciso da permissão `Anexar Links` para executar este comando');
            return;
        }

        const HTTP = /^[a-zA-Z]+:\/\//
        const PATH = /(\/(.+)?)/g

        const url = args[0].replace(HTTP, '').replace(PATH, '');

        const body = await fetch(`https://isitup.org/${url}.json`).then(res => res.json()).catch(err => null);

        if (!body) {
            message.channel.createMessage(':x: Ocorreu um erro!');
            return;
        }

        const embed = new this.client.embed()
            .setColor('RANDOM')
            .setTimestamp()
            .setFooter(`${message.author.username}#${message.author.discriminator}`, message.author.dynamicAvatarURL());

        if (body.response_code) {
            body.response_time *= 1e3;
            embed.setTitle('<:online:804049640437448714> Está Online')
                .setDescription(`O site **${args[0]}** com o IP **${body.response_ip}** respondeu com o código **${body.response_code}** em **${body.response_time}ms**.`)
        }else {
            embed.setTitle('<:offline:804049815713480715> Está Offline')
                .setDescription(`O site **${args[0]}** está offline.`)
        }

        message.channel.createMessage({ embed });
    }
}