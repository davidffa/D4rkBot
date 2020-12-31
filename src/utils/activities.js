const mstodate = require('./mstodate');
const botDB = require('../models/botDB');

module.exports.load = (client) => {
    let id = 0;

    setInterval(() => {
        switch (id) {
            case 0:
                client.user.setActivity('D4rkB', { type: 'WATCHING' });
                break;
            case 1:
                client.user.setActivity(`${client.guilds.cache.size} Servidores`, { type: 'WATCHING' });
                break;
            case 2:
                client.user.setActivity(`${client.users.cache.size} Utilizadores`, { type: 'WATCHING' });
                break;
            case 3:
                client.user.setActivity('db.help ou @D4rkBot', { type: 'PLAYING' });
                break;
            case 4:
                client.user.setActivity(`${client.music.nodes.first().stats.players} músicas`, { type: 'LISTENING' });
                break;
            case 5:
                client.user.setActivity(`Online à ${mstodate(client.uptime)}`, { type: 'STREAMING' });
                break;
            case 6:
                const { commands } = await botDB.findOne({ botID: client.user.id });
                client.user.setActivity(`${commands} comandos executados`, { type: 'WATCHING' });
            default:
                id = -1;
                break;
        }
        id++;
    }, 30000);
}