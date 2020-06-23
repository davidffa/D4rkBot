const { Schema, model } = require('mongoose')

const prefixdb = new Schema({
    guildID: {
        type: String,
        required: true
    },
    prefix: {
        type: String,
        required: true
    }
})

module.exports = model("PrefixDB", prefixdb)