const { Schema, model } = require('mongoose');

const botDB = new Schema({
    botID: { 
        required: true,
        type: String
    },
    commands: {
        type: Number
    }
}, { 
    versionKey: false
});

module.exports = model("Bot", botDB);