const play = require('./play');

module.exports = {
    name: 'resume',
    description: 'Retoma a música atual.',
    aliases: ['retomar'], 
    category: 'Musica',
    guildOnly: true,
    cooldown: 2,
    execute(client, message) {
        try {
            play.play.resume(message, message.author);
        }catch (e) {
            message.channel.send(':x: Não estou a tocar nada de momento!');
            console.log(e.message);
        }
    }
}