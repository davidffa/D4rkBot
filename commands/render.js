const { MessageEmbed } = require('discord.js');
const canvas = require('canvas');

module.exports = {
    name: 'render',
    description: 'Renderiza uma página web',
    aliases: ['webrender'], 
    category: 'Outros',
    usage: '<URL>',
    cooldown: 3,
    async execute(client, message, args, prefix) {
        if (message.author.id != '334054158879686657')
            return message.channel.send('Comando em manutenção!');

        if (!args.length) 
            return message.channel.send(`:x: Argumentos em falta, **Usa:** ${prefix}render <URL>`);

        canvas.loadImage(args[0]).then((img) => {
            const embed = new MessageEmbed()
                .setTitle(`(${args[0]})[${args[0]}]`)
                .setImage(img)
                .setFooter(`${message.author.tag}`, message.author.displayAvatarURL())
                .setTimestamp();
            message.channel.send(embed);
        }).catch(message.channel.send(':x: Link inválido!'));
    }
}