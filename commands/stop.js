const play = require('./play');

module.exports = {
    name: 'stop',
    description: 'Para a música atual, sai do canal de voz e limpa a lista de músicas.',
    aliases: ['parar', 'disconnect', 'desconnectar', 'leave', 'sair'], 
    category: 'Musica',
    guildOnly: true,
    cooldown: 5,
    execute(client, message) {
        try {
            play.play.stop(message, message.author);
        }catch (e) {
            message.channel.send(':x: Não estou a tocar nada de momento!');
            console.log(e.message);
        }
    }
}