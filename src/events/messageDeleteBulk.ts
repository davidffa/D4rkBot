import Client from '../structures/Client';
import { ReactionCollector } from '../structures/Collector';

import { Message } from 'eris';

export default class MessageDeleteBulk {
  client: Client;

  constructor(client: Client) {
    this.client = client;
  }

  run(message: Message[]) {
    const msgIDs = message.map(m => m.id);
    
    const collectors: ReactionCollector[] = [];

    for (const collector of this.client.reactionCollectors) {
      if (msgIDs.includes(collector.message.id)) {
        collectors.push(collector);
      }
    };

    for (const c of collectors) {
      c.stop('Message Delete');
    }
  }
}