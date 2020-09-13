const { MessageEmbed } = require('discord.js');

module.exports = {
    name: 'invite',
    description: 'Link do meu convite.',
    aliases: ['convite', 'inv'], 
    category: 'info',
    cooldown: 3,
    execute(client, message, args, prefix) {
        const embed = new MessageEmbed()
                        .setColor('RANDOM')
                        .setTitle('Convite')
                        .setDescription('Clique [aqui](https://discord.com/oauth2/authorize?client_id=499901597762060288&scope=bot&permissions=8) para me adicionar ao seu servidor!')
                        .setFooter(`${message.author.tag}`, message.author.displayAvatarURL({ dynamic: true }))
                        .setTimestamp();
        message.channel.send(embed);
    }
}