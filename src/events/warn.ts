import Client from '../structures/Client';

export default class OnWarn {
  client: Client;

  constructor(client: Client) {
    this.client = client;
  }

  run(warn: string): void {
    console.warn(warn);
  }
}