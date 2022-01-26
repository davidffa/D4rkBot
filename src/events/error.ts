import Client from '../structures/Client';

export default class OnError {
  client: Client;

  constructor(client: Client) {
    this.client = client;
  }

  run(err: Error): void {
    if (err.message.includes('peer') || err.message.includes('1001')) {
      console.log(`[Client Error] ${err.message}`);
      return;
    }
    console.error(err);
  }
}