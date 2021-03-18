import Client from '../structures/Client';

import { Channel } from 'eris';

export default class ChannelDelete {
    client: Client;

    constructor(client: Client) {
      this.client = client;
    }

    run(channel: Channel) {
      this.client.reactionCollectors.forEach(collector => {
        if (collector.message.channel.id === channel.id) {
          collector.stop('Channel Delete')
        }
      });

      this.client.messageCollectors.forEach(collector => {
        if (collector.channel.id === channel.id) {
          collector.stop('Channel Delete')
        }
      });
    }
}