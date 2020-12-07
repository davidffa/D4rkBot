const lavalink = require('../utils/lavalink');
const activities = require('../utils/activities');

const fs = require('fs');
const path = require('path');
const { MessageAttachment } = require('discord.js');
const moment = require('moment');
moment.locale('pt-PT');

module.exports.run = async (client) => {
    console.log("D4rkBot iniciado");
    console.log(`Utilizadores: ${client.users.cache.size} \nServidores: ${client.guilds.cache.size}`)
    activities.load(client);

    client.voiceStateTimeouts = new Map(); // Key: guildID, Value: {timeout, message}
    client.searchMsgCollectors = new Map(); // Key: userID, Value: { MessageCollector, message }
    lavalink.load(client);

    const logPath = path.resolve(__dirname, '..', '..', 'logs', 'latest.txt')

    if (fs.existsSync(logPath))
        fs.unlinkSync(logPath);

    const canal = client.channels.cache.get('775420724990705736');

    setInterval(async () => {
        const attachment = new MessageAttachment(logPath)

        if (fs.existsSync(logPath)) {
            await canal.send(`:bookmark_tabs: Log dos comandos.\nData: \`${moment(Date.now()).format('LLLL')}\``, attachment)
            fs.unlinkSync(logPath);
        }
    }, 2 * 60 * 60 * 1000);

    client.levels = new Map()
        .set('none', 0.0)
        .set('low', 0.10)
        .set('medium', 0.15)
        .set('high', 0.25);
}