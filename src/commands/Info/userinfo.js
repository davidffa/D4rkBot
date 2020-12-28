const { MessageEmbed } = require('discord.js');
const moment = require('moment');
moment.locale('pt-PT');

function getStatus(status) {
    let outStatus = status;
    if (status === 'idle') outStatus = 'Ausente';
    else if (status === 'dnd') outStatus = 'Ocupado';
    return outStatus;
}

function getDevice(user) {
    if (!user.presence.clientStatus) return null;
    const devices = Object.keys(user.presence.clientStatus);

    const deviceList = devices.map(device => {
        if (device === 'desktop')
            return ':computer:';
        else if (device === 'mobile')
            return ':mobile_phone:';
        else return ':globe_with_meridians:';
    });

    return deviceList.join(' - ');
}

module.exports = {
    name: 'userinfo',
    description: 'Informações sobre algum utilizador',
    usage: '[nome]',
    aliases: ['ui', 'usrinfo'],
    category: 'Info',
    guildOnly: true,
    cooldown: 5,
    async execute(client, message, args) {
        let user;

        if (!args.length) {
            user = message.author;
        } else {
            user = message.mentions.users.first() || await client.utils.findUser(client, message.guild, args);
        }

        if (!user) return message.channel.send(':x: Utilizador não encontrado!');

        const embed = new MessageEmbed()
            .setColor('RANDOM')
            .setTitle(`Informações de ${user.bot ? '<:bot_bot:568569868358516770> ' : ''}${message.guild.members.cache.get(user.id) ? message.guild.members.cache.get(user.id).displayName : user.username}`)
            .addField(':bookmark_tabs: Tag', `\`${user.tag}\``, true)
            .addField(':closed_book: ID', `\`${user.id}\``, true)
            .addField(':calendar: Conta criada em', `\`${moment(user.createdAt).format('L')} (${moment(user.createdAt).startOf('day').fromNow()})\``, true)
            .setTimestamp()
            .setThumbnail(user.displayAvatarURL())
            .setFooter(message.author.tag, message.author.displayAvatarURL({ dynamic: true }));

        if (message.guild.members.cache.get(user.id)) {
            embed.addField(':calendar: Entrada no servidor', `\`${moment(message.guild.member(user).joinedAt).format('L')} (${moment(message.guild.member(user).joinedAt).startOf('day').fromNow()})\``, true)
                .addField(':shrug: Status', `\`${getStatus(user.presence.status)}\``, true);

            const device = getDevice(user);

            if (device) {
                embed.addField('Dispositivos :technologist:', device, true);
            }
        }

        return message.channel.send(embed);
    }
}