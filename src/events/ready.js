const lavalink = require('../utils/lavalink');
const activities = require('../utils/activities');

module.exports.run = async (client) => {
    console.log("D4rkBot iniciado");
    console.log(`Utilizadores: ${client.users.cache.size} \nServidores: ${client.guilds.cache.size}`)
    activities.load(client);

    client.voiceStateTimeouts = new Map(); // Key: guildID, Value: {timeout, message}
    lavalink.load(client);

    client.levels = new Map()
        .set('none', 0.0)
        .set('low', 0.10)
        .set('medium', 0.15)
        .set('high', 0.25);
}