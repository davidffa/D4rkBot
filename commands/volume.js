const play = require('./play');

module.exports = {
    name: 'volume',
    description: 'Muda o volume da música',
    category: 'Musica',
    aliases: ['vol'],
    usage: '[volume (1/200)]',
    guildOnly: true,
    cooldown: 3,
    execute(client, message, args) {
        try {
            play.play.volume(message, message.author, args[0]);
        }catch (e) {
            message.channel.send(':x: Não estou a tocar nada de momento!');
            console.log(e.message);
        }
    }
}