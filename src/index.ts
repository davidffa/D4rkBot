import 'dotenv/config';
import './Database';

import Client from './structures/Client';

process.on('uncaughtException', console.error);
process.on('unhandledRejection', console.error);

const client = new Client();

client.loadCommands();
client.loadEvents();

client.connect();