const play = require('./play');

module.exports = {
    name: 'clearqueue',
    description: 'Limpa a lista de músicas ou uma música específica.',
    aliases: ['limparlista'], 
    usage: '[posição]',
    category: 'Musica',
    guildOnly: true,
    cooldown: 5,
    execute(client, message, args) {
        try {
            play.play.clearqueue(message, message.author, args[0]);
        }catch (e) {
            message.channel.send(':x: Não estou a tocar nada de momento!');
            console.log(e.message);
        }
    }
}