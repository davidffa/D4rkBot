import Client from '../structures/Client';
import Logger from '../utils/Logger';

export default class OnWarn {
  client: Client;

  private readonly log: Logger;

  constructor(client: Client) {
    this.client = client;

    this.log = Logger.getLogger(this.constructor.name);
  }

  run(warn: string): void {
    this.log.warn(warn);
  }
}