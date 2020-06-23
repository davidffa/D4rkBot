const { MessageEmbed } = require('discord.js');

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
                .addField(":crown: Dono do servidor:", `<@${message.guild.owner.id}>`)
                .addField(":calendar: Criado em:", message.guild.createdAt)
                .addField(":closed_book: ID", message.guild.id)
                .addField(`:man: Membros [${membersSize}]`, `Online: ${online}\nAusente: ${idle}\n` +
                                                            `Ocupado: ${dontDisturb}\n Offline: ${offline}\n Bots: ${bot}`)
                .addField(`:white_small_square:Canais [${textChannels + voiceChannels}]`, `Texto: ${textChannels}\n Voz: ${voiceChannels}`)
                .addField(`:spider_web: Cargos`, `[${message.guild.roles.cache.size}]`)
                .setThumbnail(message.guild.iconURL)
                .setTimestamp()
                .setFooter(message.author.tag, message.author.avatarURL)
        message.channel.send(embed)
    }
};