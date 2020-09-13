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
        }else if (!isNaN(args[0]) && args[0].length === 18) {
            user = client.users.cache.get(args[0]);
        }else {
            const userMentioned = message.mentions.users.first();
            if (userMentioned) {
                user = userMentioned;
            }else {
                message.guild.members.cache.map(member => {
                    if (member.displayName === args.join(' ')) 
                        user = member.user;
                });

                if (!user) {
                    message.guild.members.cache.map(member => {
                        if (member.displayName.toLowerCase().startsWith(args.join(' ').toLowerCase())) {
                            user = member.user;
                        }
                    });
                }
            }
        }

        if (!user) 
            return message.channel.send(':x: Utilizador não encontrado!');

        const url = user.displayAvatarURL({ format: 'png', dynamic: true, size: 2048 });

        const embed = new MessageEmbed()
            .setTitle(`:frame_photo: ${user.tag}`)
            .setColor('RANDOM')
            .setDescription(`:diamond_shape_with_a_dot_inside: Clique [aqui](${url}) para baixar a imagem!`)
            .setImage(url)
            .setTimestamp()
            .setFooter(message.author.tag, message.author.displayAvatarURL({ dynamic: true }));

        return message.channel.send(embed);
    }
}