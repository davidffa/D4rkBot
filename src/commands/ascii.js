const figlet = require('figlet');

module.exports = {
    name: 'ascii',
    description: 'Torna uma frase numa ascii art',
    aliases: ['asciiart'], 
    category: 'Outros',
    args: 1,
    usage: '<Frase/Palavra>',
    cooldown: 3,
    execute(_client, message, args) {
        if (args.join(' ').length > 15)
            return message.channel.send(':x: Máximo de 15 caracteres permitido!');
        
        figlet(args.join(' '), (err, data) => {
            if (err) 
                return message.channel.send(':x: Ocorreu um erro!');

            if (data)
                message.channel.send(data, { code: 'AsciiArt' });
            else
                message.channel.send(':x: Conteúdo inválido!');
        });
    }
}