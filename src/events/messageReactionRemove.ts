import Client from '../structures/Client';

import { Message, Emoji } from 'eris';

export default class MessageReactionRemove {
  client: Client;

  constructor(client: Client) {
    this.client = client;
  }

  run(message: Message, reaction: Emoji, userID: string) {
    for (const collector of this.client.reactionCollectors) {
      if (collector.message.id === message.id) {
        const user = this.client.users.get(userID);
        if (user)
          collector.remove(reaction, user);
      }
    };
  }
}