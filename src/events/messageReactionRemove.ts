import Client from '../structures/Client';

import { Message, Emoji } from 'eris';

export default class MessageReactionRemove {
  client: Client;

  constructor(client: Client) {
    this.client = client;
  }

  run(message: Message, reaction: Emoji, userID: string) {
    this.client.reactionCollectors.forEach(collector => {
      if (collector.message.id === message.id) {
        collector.emit('remove', reaction, this.client.users.get(userID));
      }
    });
  }
}