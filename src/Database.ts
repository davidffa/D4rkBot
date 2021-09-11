import { createConnection } from 'mongoose';

export const mainDB = createConnection(process.env.MONGODBURI as string).once('open', () => console.log('Main DB conectada!'));
export const sharedDB = mainDB.useDb(process.env.SHAREDDB as string).once('open', () => console.log('Shared DB conectada!'));