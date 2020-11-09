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
    lavalink.load(client);

    const logPath = path.resolve(__dirname, '..', '..', 'logs', 'latest.txt')

    if (fs.existsSync(logPath))
        fs.unlinkSync(logPath);

    setInterval(() => {
        const attachment = new MessageAttachment(logPath)

        if (fs.existsSync(logPath)) {
            client.guilds.cache.get('581220467315179520').channels.cache.get('775420724990705736').send(`:bookmark_tabs: Log dos comandos.\nData: \`${moment(Date.now()).format('LLLL')}\``, attachment)
            fs.unlinkSync(logPath);
        }
    }, 2 * 60 * 60 * 1000);

    client.levels = new Map()
        .set('none', 0.0)
        .set('low', 0.10)
        .set('medium', 0.15)
        .set('high', 0.25);
}