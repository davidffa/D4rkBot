const { MessageEmbed } = require('discord.js');

module.exports = {
    name: 'servericon',
    description: 'Converte o avatar do servidor numa imagem', 
    aliases: ['serveravatar'],
    category: 'Outros',
    guildOnly: true,
    cooldown: 3,
    execute(_client, message) {
        const guild = message.guild;

        if (!guild.icon) return message.channel.send(':x: O servidor não tem icon!');

        const url = guild.iconURL({ format: 'png', dynamic: true });

        const embed = new MessageEmbed()
            .setTitle(`:frame_photo: Icon do servidor **${guild.name}**`)
            .setColor('RANDOM')
            .setDescription(`:diamond_shape_with_a_dot_inside: Clique [aqui](${url}) para baixar a imagem!`)
            .setImage(url)
            .setTimestamp()
            .setFooter(message.author.tag, message.author.displayAvatarURL({ dynamic: true }));

        return message.channel.send(embed);
    }
};