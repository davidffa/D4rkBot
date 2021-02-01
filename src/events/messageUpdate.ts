import Client from '../structures/Client';

import { Message, OldMessage } from 'eris';

module.exports = class {
    client: Client;

    constructor(client: Client) {
        this.client = client;
    }

    run(message: Message, oldMessage: OldMessage) {
        if (oldMessage.content === message.content) return;

        this.client.emit('messageCreate', message);
    }
}