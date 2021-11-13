import Client from '../structures/Client';

export default class Ready {
  client: Client;

  constructor(client: Client) {
    this.client = client;
  }

  async run() {
    console.log('D4rkBot iniciado');
    console.log(`Utilizadores: ${this.client.users.size}\nServidores: ${this.client.guilds.size}`);

    this.client.connectLavaLink();
    this.client.loadStatus();
    this.client.loadBotCache();
    // this.client.loadLogs();
  }
}