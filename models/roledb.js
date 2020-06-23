const { Schema, model } = require('mongoose')

const roledb = new Schema({
    guildID: {
        type: String,
        required: true,
    },
    roleID: {
        type: String,
        required: true,
    },
})

module.exports = model("RoleDB", roledb)