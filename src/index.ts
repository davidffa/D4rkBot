import 'dotenv/config';
import './Database';

import Client from './structures/Client';

const client = new Client();

client.loadCommands();
client.loadEvents();

client.connect();