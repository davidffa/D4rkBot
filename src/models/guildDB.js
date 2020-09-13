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
    }
});

module.exports = model("Guild", guildDB);