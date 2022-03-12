import { mainDB } from '../Database';
import { Schema, Document } from 'mongoose';

export interface GuildDB extends Document {
  guildID: string;
  prefix?: string;
  roleID?: string;
  welcomeChatID?: string;
  memberRemoveChatID?: string;
  disabledCmds?: Array<string>;
  djrole?: string;
  didumean?: boolean;
}

const guildDB = new Schema({
  guildID: {
    type: String,
    required: true
  },
  prefix: {
    type: String
  },
  roleID: {
    type: String
  },
  welcomeChatID: {
    type: String
  },
  memberRemoveChatID: {
    type: String
  },
  disabledCmds: {
    type: Array
  },
  djrole: {
    type: String
  },
  didumean: {
    type: Boolean
  }
}, {
  versionKey: false
});

export default mainDB.model<GuildDB>("Guild", guildDB);