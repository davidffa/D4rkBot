const { MessageEmbed } = require('discord.js');

module.exports = {
    name: 'avatar',
    description: 'Converte o teu avatar ou de alguém do servidor em uma imagem', 
    category: 'Info',
    aliases: ['av'],
    guildOnly: true,
    usage: '[nome]',
    cooldown: 3,
    async execute(client, message, args) {
        let user;

        if (!args.length) {
            user = message.author;
        } else {
            user = message.mentions.users.first() || await client.utils.findUser(client, message.guild, args);
        }

        if (!user) 
            return message.channel.send(':x: Utilizador não encontrado!');

        const url = user.displayAvatarURL({ format: 'png', dynamic: true, size: 2048 });

        const embed = new MessageEmbed()
            .setTitle(`:frame_photo: Avatar de ${message.guild.members.cache.get(user.id) ? message.guild.members.cache.get(user.id).displayName : user.username}`)
            .setColor('RANDOM')
            .setDescription(`:diamond_shape_with_a_dot_inside: Clique [aqui](${url}) para baixar a imagem!`)
            .setImage(url)
            .setTimestamp()
            .setFooter(message.author.tag, message.author.displayAvatarURL({ dynamic: true }));

        return message.channel.send(embed);
    }
}