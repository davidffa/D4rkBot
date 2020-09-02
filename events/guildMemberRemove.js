const welcomedb = require("../models/welcomedb");

module.exports.run = async (client, member) => {
    const guildExists = await welcomedb.findOne({ guildID: member.guild.id });
    if (guildExists) {
        const chat = guildExists.chatID;
        client.channels.cache.get(chat).send(`Adeus \`${member.user.username}\``);
    }
}