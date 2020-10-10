const { Schema, model } = require('mongoose');

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
    disabledCmds: {
        type: Array
    }
});

module.exports = model("Guild", guildDB);