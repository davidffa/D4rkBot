import Client from '../structures/Client';

module.exports = class {
    client: Client;

    constructor(client: Client) {
        this.client = client;
    }

    run(err: Error): void {
        console.warn(`[Client Error] ${err.message}`);
    }
}