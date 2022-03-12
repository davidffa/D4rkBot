import { Schema, Document } from 'mongoose';
import { mainDB } from '../Database';

interface LevelDB extends Document {
  _id: string;
  xp: number;
  level: number;
}

const levelDB = new Schema({
  _id: {
    type: String,
    required: true
  },
  xp: {
    type: Number,
    required: true
  },
  level: {
    type: Number,
    required: true
  }
}, {
  versionKey: false
});

export default mainDB.model<LevelDB>('UserLevel', levelDB);