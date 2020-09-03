const { MessageEmbed } = require('discord.js');

module.exports = {
    name: 'say',
    description: 'Escreve algo no chat',
    aliases: ['escrever', 'falar'], 
    category: 'Outros',
    usage: '<Texto>',
    cooldown: 3,
    execute(client, message, args, prefix) {
        if (!args.length) 
            return message.channel.send(`:x: Argumentos em falta, **Usa:** ${prefix}escrever <Texto>`);
        
        const embed = new MessageEmbed()
                    .setColor('RANDOM')
                    .setTitle('Mensagem')
                    .setDescription(args.join(' '))
                    .setFooter(message.author.tag, message.author.displayAvatarURL({ dynamic: true }))
                    .setTimestamp();
                    
        message.channel.send(embed);
    }
}