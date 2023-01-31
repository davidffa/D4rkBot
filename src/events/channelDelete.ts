import Client from '../structures/Client';

import { Channel } from 'oceanic.js';

export default class ChannelDelete {
  client: Client;

  constructor(client: Client) {
    this.client = client;
  }

  run(channel: Channel) {
    for (const collector of this.client.componentCollectors) {
      if (collector.message.channel!.id === channel.id) {
        collector.stop('Channel Delete');
      }
    }
  }
}