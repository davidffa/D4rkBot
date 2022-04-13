import Client from '../structures/Client';
import Logger from '../utils/Logger';

export default class OnError {
  client: Client;

  private readonly log: Logger;

  constructor(client: Client) {
    this.client = client;

    this.log = Logger.getLogger(this.constructor.name);
  }

  run(err: Error): void {
    if (err.message.includes('peer') || err.message.includes('1001')) {
      this.log.warn(err.message);
      return;
    }

    this.log.error(err.message);
    console.error(err);
  }
}