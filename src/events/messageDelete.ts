import Client from '../structures/Client';

import { Message } from 'eris';

export default class MessageDelete {
  client: Client;

  constructor(client: Client) {
    this.client = client;
  }

  run(message: Message) {
    for (const collector of this.client.reactionCollectors) {
      if (collector.message.id === message.id) {
        collector.stop('Message Delete');
      }
    };
  }
}