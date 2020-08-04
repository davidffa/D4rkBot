const { MessageEmbed } = require('discord.js');

module.exports = {
    name: 'avatar',
    description: 'Converte o teu avatar ou de alguém do servidor em uma imagem', 
    category: 'Outros',
    guildOnly: true,
    usage: '[nome]',
    cooldown: 3,
    execute(client, message, args, prefix) {
        let user;

        if (!args.length) {
            user = message.author;
        }else {
            const userMentioned = message.mentions.users.first();
            if (userMentioned) {
                user = userMentioned;
            }else {
                message.guild.members.cache.map(member => {
                    if (member.user.tag.toLowerCase().startsWith(args[0].toLowerCase())) {
                        user = member.user;
                    }
                })
            }
        }

        if (!user) 
            return message.channel.send(':x: Utilizador não encontrado!');

        const url = user.displayAvatarURL({ format: 'png', size: 2048 });

        const embed = new MessageEmbed()
            .setTitle(`:frame_photo: ${user.tag}`)
            .setColor('RANDOM')
            .setDescription(`:diamond_shape_with_a_dot_inside: Clique [aqui](${url}) para baixar a imagem!`)
            .setImage(url)
            .setTimestamp()
            .setFooter(message.author.tag, message.author.displayAvatarURL());

        return message.channel.send(embed);
    }
}