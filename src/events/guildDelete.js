const guildDB = require('../models/guildDB');

module.exports.run = async (client, guild) => {
    await guildDB.findOneAndDelete({ guildID: guild.id });
}