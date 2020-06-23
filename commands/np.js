const play = require('./play');

module.exports = {
    name: 'np',
    description: 'Mostra a música que está a tocar.',
    aliases: ['nowplaying'], 
    category: 'Musica',
    guildOnly: true,
    cooldown: 5,
    execute(client, message) {
        try {
            play.play.np(message);
        }catch (e) {
            message.channel.send(':x: Não estou a tocar nada de momento!');
            console.log(e.message);
        }
    }
}