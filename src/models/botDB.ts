import { mainDB } from '../Database';
import { Schema, Document } from 'mongoose';

interface BotDB extends Document {
  botID: string;
  commands?: number;
  lockedCmds?: Array<string>;
  blacklist?: Array<string>;
}

const botDB: Schema = new Schema({
  botID: {
    required: true,
    type: String
  },
  commands: {
    type: Number
  },
  lockedCmds: {
    type: Array
  },
  blacklist: {
    type: Array
  }
}, {
  versionKey: false
});

export default mainDB.model<BotDB>("Bot", botDB);