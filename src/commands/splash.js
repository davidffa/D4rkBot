const { MessageEmbed } = require('discord.js');

module.exports = {
    name: 'splash',
    description: 'Mostra o splash do servidor', 
    category: 'Info',
    aliases: ['serversplash'],
    guildOnly: true,
    cooldown: 3,
    execute(_client, message) {
        if (!message.guild.splash)
            return message.channel.send(':x: O servidor não tem um splash!');

        const url = message.guild.splashURL({ dynamic: true, size: 2048, format: 'png' });

        const embed = new MessageEmbed()
            .setTitle(`:frame_photo: Splash do servidor **${message.guild.name}**`)
            .setColor('RANDOM')
            .setDescription(`:diamond_shape_with_a_dot_inside: Clique [aqui](${url}) para baixar a imagem!`)
            .setImage(url)
            .setTimestamp()
            .setFooter(message.author.tag, message.author.displayAvatarURL({ dynamic: true }));

        return message.channel.send(embed);
    }
}