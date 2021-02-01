import { Schema, model, Document } from 'mongoose';

interface BotDB extends Document {
    botID: string;
    commands?: number;
    lockedCmds?: Array<string>;
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
    }
}, { 
    versionKey: false
});

export default model<BotDB>("Bot", botDB);