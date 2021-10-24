import { RawPacket } from 'eris';
import Client from '../structures/Client';

export default class RawWS {
  client: Client;

  constructor(client: Client) {
    this.client = client;
  }

  async run(packet: RawPacket) {
    if (packet.t === 'INTERACTION_CREATE') {
      const packetData = packet.d as any;

      if (packetData.type === 4) { // APPLICATION_COMMAND_AUTOCOMPLETE
        const data = packetData.data;

        const cmd = this.client.commands.find(cmd => cmd.name === data.name);

        if (!cmd) throw new Error(`Command ${data.name} does not exist!`);

        const focusedField = data.options.find((op: any) => op.focused);

        cmd.runAutoComplete?.(packetData.id, packetData.token, focusedField.value);
      }
    }
  }
}