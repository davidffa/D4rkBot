const play = require('./play');

module.exports = {
    name: 'pause',
    description: 'Pausa a música atual.',
    aliases: ['pausa'], 
    category: 'Musica',
    guildOnly: true,
    cooldown: 2,
    execute(client, message) {
        try {
            play.play.pause(message, message.author);
        }catch (e) {
            message.channel.send(':x: Não estou a tocar nada de momento!');
            console.log(e.message);
        }
    }
}