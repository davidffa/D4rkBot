import Client from '../structures/Client';

import { Message, OldMessage } from 'eris';

export default class MessageUpdate {
    client: Client;

    constructor(client: Client) {
        this.client = client;
    }

    run(message: Message, oldMessage: OldMessage) {
        if (!oldMessage || !message || oldMessage.content === message.content) return;

        this.client.emit('messageCreate', message);
    }
}