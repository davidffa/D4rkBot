import Command from '../../structures/Command';
import Client from '../../structures/Client';

import { Message } from 'eris';

export default class Uptime extends Command {
    constructor(client: Client) {
        super(client, {
            name: 'uptime',
            description: 'Mostra à quanto tempo estou online.',
            category: 'Info',
            aliases: ['ontime'],
            cooldown: 5,
            dm: true
        });
    }

    execute(message: Message): void {
        message.channel.createMessage(`<a:malakoi:478003266815262730> Estou online há \`${this.client.utils.msToDate(process.uptime() * 1e3)}\``)
    }
}