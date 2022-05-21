import 'dotenv/config';
import './Database';

import Client from './structures/Client';
import Logger from './utils/Logger';

process.on('uncaughtException', (err) => console.error(`${Logger.currentDate} ${Logger.COLORS.BOLD}${Logger.COLORS.GREEN}MAIN ${Logger.COLORS.RED}ERROR${Logger.COLORS.RESET}`, err));
process.on('unhandledRejection', (err) => console.error(`${Logger.currentDate} ${Logger.COLORS.BOLD}${Logger.COLORS.GREEN}MAIN ${Logger.COLORS.RED}ERROR${Logger.COLORS.RESET}`, err));

const client = new Client();

client.loadCommands();
client.loadEvents();

client.connect();