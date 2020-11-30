const { MessageEmbed } = require('discord.js');

module.exports = {
    name: 'banner',
    description: 'Mostra a imagem da banner do servidor', 
    category: 'Info',
    aliases: ['serverbanner'],
    guildOnly: true,
    cooldown: 3,
    execute(_client, message) {
        if (!message.guild.banner)
            return message.channel.send(':x: O servidor não tem um banner!');

        const url = message.guild.bannerURL({ dynamic: true, size: 2048, format: 'png' });

        const embed = new MessageEmbed()
            .setTitle(`:frame_photo: Banner do servidor **${message.guild.name}**`)
            .setColor('RANDOM')
            .setDescription(`:diamond_shape_with_a_dot_inside: Clique [aqui](${url}) para baixar a imagem!`)
            .setImage(url)
            .setTimestamp()
            .setFooter(message.author.tag, message.author.displayAvatarURL({ dynamic: true }));

        return message.channel.send(embed);
    }
}