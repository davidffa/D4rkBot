import { createConnection } from 'mongoose';
import Logger from './utils/Logger';

const log = Logger.getLogger("Database");

export const mainDB = createConnection(process.env.MONGODBURI).once('open', () => log.info('Main DB conectada!'));
export const sharedDB = mainDB.useDb(process.env.SHAREDDB).once('open', () => log.info('Shared DB conectada!'));