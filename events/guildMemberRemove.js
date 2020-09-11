const guildDB = require("../models/guildDB");

module.exports.run = async (client, member) => {
    const guild = await guildDB.findOne({ guildID: member.guild.id });
    if (guild && guild.welcomeChatID) {
        const chat = guild.welcomeChatID;
        client.channels.cache.get(chat).send(`O membro \`${member.user.username}#${member.user.discriminator}\` saiu do servidor.`);
    }
}