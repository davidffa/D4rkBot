import Client from '../structures/Client';
import Interaction from '../structures/Interaction';

import { RawPacket } from 'eris';
import { InteractionPacket } from '../typings/index';

export default class RawWS {
  client: Client;

  constructor(client: Client) {
    this.client = client;
  }

  async run(packet: RawPacket) {
    if (packet.t === 'INTERACTION_CREATE' && packet.d) {
      const interactionData = packet.d as InteractionPacket;

      this.client.emit('interactionCreate', new Interaction(this.client, interactionData));
    }
  }
}