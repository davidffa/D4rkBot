import { Schema, Document } from 'mongoose';
import { mainDB } from '../Database';

export interface LevelDB extends Document {
  _id: string;
  guildID: string;
  xp: number;
}

const levelDB = new Schema({
  _id: {
    type: String,
    required: true
  },
  guildID: {
    type: String,
    required: true
  },
  xp: {
    type: Number,
    required: true,
    default: 0
  }
}, {
  versionKey: false
});

export default mainDB.model<LevelDB>('UserLevel', levelDB);