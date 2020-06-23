const play = require('./play');

module.exports = {
    name: 'queue',
    description: 'Mostra a lista de músicas.',
    aliases: ['lista', 'list', 'musiclist'], 
    category: 'Musica',
    guildOnly: true,
    cooldown: 5,
    execute(client, message) {
        try {
            play.play.queue(message, message.author);
        }catch (e) {
            message.channel.send(':x: Não estou a tocar nada de momento!');
            console.log(e.message);
        }
    }
}