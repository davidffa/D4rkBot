const { Schema, model } = require('mongoose')

const welcomedb = new Schema({
    guildID: {
        type: String,
        required: true,
    },
    chatID: {
        type: String,
        required: true,
    },
})

module.exports = model("WelcomeDB", welcomedb)