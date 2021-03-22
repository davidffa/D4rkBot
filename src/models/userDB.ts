import { Schema, model, Document } from 'mongoose';

interface Song {
  name: string;
  url: string;
  author: string;
  duration: number;
  yt: boolean;
}

interface PlayList {
  name: string;
  songs?: Song[];
}

interface UserDB extends Document {
  _id: string;
  playlists?: PlayList[];
}

const userDB = new Schema({
  _id: { 
    type: String,
    required: true
  },

  playlists: [
    { 
      name: String,
      songs: [
        { 
          name: String,
          url: String,
          author: String,
          duration: Number,
          yt: Boolean
        }
      ]
    }
  ]
}, { 
  versionKey: false
});

export default model<UserDB>('User', userDB);