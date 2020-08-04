const { MessageEmbed } = require('discord.js');
const moment = require('moment');
moment.locale('pt-PT');

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
                    if (member.user.tag.toLowerCase().startsWith(args[0].toLowerCase())) {
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
            .addField(':calendar: Conta criada em', `\`${moment(user.createdAt).format('L')} (${moment(user.createdAt).startOf('day').fromNow()})\``, true)
            .addField(':calendar: Entrada no servidor', `\`${moment(message.guild.member(user).joinedAt).format('L')} (${moment(message.guild.member(user).joinedAt).startOf('day').fromNow()})\``, true)
            .addField(':shrug: Status', `\`${getStatus(user.presence.status)}\``, true)
            .setTimestamp()
            .setThumbnail(user.displayAvatarURL())
            .setFooter(message.author.tag, message.author.displayAvatarURL());
        return message.channel.send(embed);
    }
}