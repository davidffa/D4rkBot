import 'dotenv/config';
import './Database';

import Client from './structures/Client';

process.on('uncaughtException', (err) => {
  console.error(err);
});

process.on('unhandledRejection', (err) => {
  console.error(err);
});

const client = new Client();

client.loadCommands();
client.loadEvents();

client.connect();