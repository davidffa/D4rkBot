const { MessageEmbed } = require('discord.js');

function getStatus(status) {
    let outStatus = status;
    if (status === 'idle') outStatus = 'Ausente';
    else if (status === 'dnd') outStatus = 'Ocupado';
    return outStatus;
}

module.exports = {
    name: 'userinfo',
    description: 'Informações sobre o servidor', 
    usage: '[nome]',
    category: 'Info',
    guildOnly: true,
    cooldown: 5,
    execute(client, message, args) {
        let user;

        if (!args.length) {
            user = message.author;
        }else {
            const userMentioned = message.mentions.users.first();
            if (userMentioned) {
                user = userMentioned;
            }else {
                message.guild.members.cache.map(member => {
                    if (member.user.tag.startsWith(args[0])) {
                        user = member.user;
                    }
                })
            }
        }

        if (!user) return message.channel.send(':x: Utilizador não encontrado!');
        
        const embed = new MessageEmbed()
            .setColor('RANDOM')
            .setTitle(':information_source: Informações de Utilizador')
            .addField(':bookmark_tabs: Tag', `\`${user.tag}\``, true)
            .addField(':closed_book: ID', `\`${user.id}\``, true)
            .addField(':calendar: Conta criada em', `\`${user.createdAt}\``, true)
            .addField(':calendar: Entrada no servidor', `\`${message.guild.member(user).joinedAt}\``, true)
            .addField(':shrug: Status', `\`${getStatus(user.presence.status)}\``, true)
            .setTimestamp()
            .setThumbnail(user.displayAvatarURL())
            .setFooter(message.author.tag, message.author.displayAvatarURL());
        return message.channel.send(embed);
    }
}