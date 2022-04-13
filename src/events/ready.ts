import Client from '../structures/Client';
import Logger from '../utils/Logger';

export default class Ready {
  client: Client;

  private readonly log: Logger;

  constructor(client: Client) {
    this.client = client;

    this.log = Logger.getLogger(this.constructor.name);
  }

  async run() {
    this.log.info('D4rkBot iniciado');
    this.log.info(`Utilizadores: ${this.client.users.size}`);
    this.log.info(`Servidores: ${this.client.guilds.size}`);

    this.client.connectLavaLink();
    this.client.loadStatus();
    this.client.loadBotCache();
    this.client.loadLogs();
  }
}