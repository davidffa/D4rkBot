import Client from '../structures/Client';

import { Message } from 'oceanic.js';

export default class MessageDelete {
  client: Client;

  constructor(client: Client) {
    this.client = client;
  }

  run(message: Message) {
    for (const collector of this.client.componentCollectors) {
      if (collector.message.id === message.id) {
        collector.stop('Message Delete');
      }
    }
  }
}