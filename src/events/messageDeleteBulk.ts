import Client from '../structures/Client';

import { Message } from 'eris';

export default class MessageDeleteBulk {
  client: Client;

  constructor(client: Client) {
    this.client = client;
  }

  run(message: Message[]) {
    const msgIDs = message.map(m => m.id);

    for (const collector of this.client.componentCollectors) {
      if (msgIDs.includes(collector.message.id)) {
        collector.stop('Message Delete');
      }
    }
  }
}