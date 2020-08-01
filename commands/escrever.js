module.exports = {
    name: 'escrever',
    description: 'Escreve algo no chat',
    aliases: ['falar'], 
    category: 'Outros',
    usage: '<Texto>',
    cooldown: 3,
    execute(client, message, args, prefix) {
        if (!args.length) 
            return message.channel.send(`:x: Argumentos em falta, **Usa:** ${prefix}escrever <Texto>`);
        
        return message.channel.send(args.join(' '));
    }
}