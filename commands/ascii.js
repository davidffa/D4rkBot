const figlet = require('figlet');

module.exports = {
    name: 'ascii',
    description: 'Torna uma frase numa ascii art',
    aliases: ['asciiart'], 
    category: 'Outros',
    usage: '<Frase/Palavra>',
    cooldown: 3,
    execute(client, message, args, prefix) {
        if (!args.length) 
            return message.channel.send(`:x: Argumentos em falta, **Usa:** ${prefix}ascii <Frase/Palavra>`);
        if (args.join(' ').length > 20)
            return message.channel.send(':x: Máximo de 20 caracteres permitido!');
        
        figlet(args.join(' '), (err, data) => {
            if (err) 
                return message.channel.send(':x: Ocorreu um erro!');

            message.channel.send(data, { code: 'AsciiArt' });
        });
    }
}