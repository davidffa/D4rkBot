import Client from '../structures/Client';

import { Message, Emoji, Member } from 'eris';

interface Reactor {
  id: string;
}

export default class MessageReactionAdd {
  client: Client;

  constructor(client: Client) {
    this.client = client;
  }

  run(message: Message, reaction: Emoji, reactor: Member|Reactor) {
    for (const collector of this.client.reactionCollectors) {
      if (collector.message.id === message.id) {
        const user = this.client.users.get(reactor.id);
        if (user)
          collector.collect(reaction, user);
      }
    };
  }
}