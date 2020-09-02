const { MessageEmbed } = require('discord.js');
const moment = require('moment')
moment.locale('pt-PT');

module.exports = {
    name: 'serverinfo',
    description: 'Informações sobre o servidor', 
    category: 'Info',
    guildOnly: true,
    cooldown: 5,
    execute(client, message) { 
        const online = message.guild.members.cache.filter(member => member.presence.status == "online").size
        const dontDisturb = message.guild.members.cache.filter(member => member.presence.status == "dnd").size
        const idle = message.guild.members.cache.filter(member => member.presence.status == "idle").size
        const offline = message.guild.members.cache.filter(member => member.presence.status == "offline").size

        const bot = message.guild.members.cache.filter(member => member.user.bot).size
        const membersSize = message.guild.memberCount

        const textChannels = message.guild.channels.cache.filter(channel => channel.type === "text").size
        const voiceChannels = message.guild.channels.cache.filter(channel => channel.type === "voice").size

        const embed = new MessageEmbed()
                .setColor("RANDOM")
                .setTitle(`:bookmark_tabs: Informações do servidor ${message.guild.name}`)
                .addField(":crown: Dono do servidor:", `${message.guild.owner.user.tag}`)
                .addField(":calendar: Criado em:", `${moment(message.guild.createdAt).format('L')} (${moment(message.guild.createdAt).startOf('day').fromNow()})`)
                .addField(":closed_book: ID", message.guild.id)
                .addField(`:man: Membros [${membersSize}]`, `<:b_online2:585881537493467175> Online: ${online}\n<:b_idle2:585881544124661801> Ausente: ${idle}\n` +
                                                            `<:b_dnd2:585881517314539523> Ocupado: ${dontDisturb}\n <:b_offline2:585881529079824385> Offline: ${offline}\n <:bot_bot:568569868358516770> Bots: ${bot}`)
                .addField(`:white_small_square:Canais [${textChannels + voiceChannels}]`, `Texto: ${textChannels}\n Voz: ${voiceChannels}`)
                .addField(`:spider_web: Cargos`, `[${message.guild.roles.cache.size}]`)
                .setThumbnail(message.guild.iconURL({ format: 'png' }))
                .setTimestamp()
                .setFooter(message.author.tag, message.author.displayAvatarURL({ dynamic: true }))
        message.channel.send(embed)
    }
};