const msToDate = require('../utils/mstodate');

module.exports = {
    name: 'uptime',
    description: 'Vê a quanto tempo eu estou online.',
    category: 'Outros',
    usage: '',
    cooldown: 3,
    execute(client, message) {
        message.channel.send(`<a:malakoi:478003266815262730> Estou online há \`${msToDate(client.uptime)}\``);
    }
}