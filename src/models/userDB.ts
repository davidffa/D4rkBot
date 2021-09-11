import { Schema, Document } from 'mongoose';
import { sharedDB } from '../Database';

interface Playlist {
  name: string;
  tracks?: string[];
}

interface UserDB extends Document {
  _id: string;
  playlists?: Playlist[];
}

const userDB = new Schema({
  _id: {
    type: String,
    required: true
  },

  playlists: [
    {
      name: String,
      tracks: Array
    }
  ]
}, {
  versionKey: false
});

export default sharedDB.model<UserDB>('User', userDB);