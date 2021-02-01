import { Schema, model, Document } from 'mongoose';

interface GuildDB extends Document {
    guildID: string;
    prefix?: string;
    roleID?: string;
    welcomeChatID?: string;
    memberRemoveChatID?: string;
    disabledCmds?: Array<string>;
    djrole?: string;
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
    }
}, { 
    versionKey: false
});

export default model<GuildDB>("Guild", guildDB);