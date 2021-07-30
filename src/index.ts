import { config } from 'dotenv';
import Client from './structures/Client';
import { connect } from 'mongoose';

config();

const client = new Client();

connect(process.env.MONGODBURI as string, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('Conectado ao banco de dados.');
}).catch(e => {
  console.error('Erro ao conectar ao banco de dados!', e);
});

client.loadCommands();
client.loadEvents();
// Inicia o bote
client.connect();
