const { MessageEmbed } = require('discord.js');
const moment = require('moment');
const fetch = require('node-fetch');
moment.locale('pt-PT');

module.exports = {
    name: 'serverinfo',
    description: 'Informações sobre o servidor',
    category: 'Info',
    guildOnly: true,
    cooldown: 5,
    async execute(_client, message, args) {
        if (!args.length || args[0] === message.guild.id) {
            let online = 0, dnd = 0, idle = 0, offline = 0;
            message.guild.members.cache.forEach(member => {
                switch (member.presence.status) {
                    case 'online':
                        online++;
                        break;
                    case 'idle':
                        idle++;
                        break;
                    case 'dnd':
                        dnd++;
                        break;
                    default:
                        offline++;
                }
            });

            const bot = message.guild.members.cache.filter(member => member.user.bot).size;
            const membersSize = message.guild.members.cache.size;

            const textChannels = message.guild.channels.cache.filter(channel => channel.type === "text").size;
            const voiceChannels = message.guild.channels.cache.filter(channel => channel.type === "voice").size;

            const regions = {
                'brazil': ':flag_br: Brasil',
                'europe': ':flag_eu: Europa',
                'eu_west': ':flag_eu: Europa',
                'hong-kong': ':flag_hk: Hong-Kong',
                'japan': ':flag_jp: Japão',
                'india': ':flag_in: Índia',
                'russia': ':flag_ru: Rússia',
                'singapore': ':flag_sg: Singapura',
                'sydney': ':flag_au: Sydney',
                'us-south': ':flag_us: Sul dos Estados Unidos',
                'us-east': ':flag_us: Este dos Estados Unidos',
                'us-central': ':flag_us: Centro dos Estados Unidos',
                'us-west': ':flag_us: Oeste dos Estados Unidos',
                'southafrica': ':flag_za: África do Sul'
            }

            const embed = new MessageEmbed()
                .setColor("RANDOM")
                .setTitle(`:bookmark_tabs: Informações do servidor ${message.guild.name}`)
                .addField(":crown: Dono do servidor", `${message.guild.owner.user.tag}`, true)
                .addField(':map: Local', regions[message.guild.region] ? regions[message.guild.region] : message.guild.region, true)
                .addField(":calendar: Criado em", `${moment(message.guild.createdAt).format('L')} (${moment(message.guild.createdAt).startOf('day').fromNow()})`, true)
                .addField(':calendar: Entrada em', `${moment(message.member.joinedAt).format('L')} (${moment(message.member.joinedAt).startOf('day').fromNow()})`, true)
                .addField(":closed_book: ID", message.guild.id, true)
                .addField(':grinning: Emojis', message.guild.emojis.cache.size, true)
                .addField(`:man: Membros [${membersSize}]`, `<:b_online2:585881537493467175> Online: ${online}\n<:b_idle2:585881544124661801> Ausente: ${idle}\n` +
                    `<:b_dnd2:585881517314539523> Ocupado: ${dnd}\n<:b_offline2:585881529079824385> Offline: ${offline}\n<:bot_bot:568569868358516770> Bots: ${bot}`, true)

                .addField(`:white_small_square:Canais [${textChannels + voiceChannels}]`, `Texto: ${textChannels}\n Voz: ${voiceChannels}`, true)
                .addField(`:spider_web: Cargos`, `[${message.guild.roles.cache.size}]`, true)
                .setThumbnail(message.guild.iconURL({ format: 'png', dynamic: true }))
                .setTimestamp()
                .setFooter(message.author.tag, message.author.displayAvatarURL({ dynamic: true }));
            if (message.guild.banner)
                embed.setImage(message.guild.bannerURL({ format: 'png', size: 2048, dynamic: true }));
            message.channel.send(embed);
        } else {
            const guild = await fetch(`https://discord.com/api/guilds/${args[0]}/widget.json`).then(res => res.json());

            if (guild.code) {
                if (guild.code === 50004)
                    message.channel.send(':x: Esse servidor tem o widget desativado!');
                else if (guild.code === 10004)
                    message.channel.send(':x: Esse servidor não existe!')
            } else if (guild.name) {
                const online = guild.members.filter(m => m.status === 'online').length;
                const dnd = guild.members.filter(m => m.status === 'dnd').length;
                const idle = guild.members.filter(m => m.status === 'idle').length;

                const embed = new MessageEmbed()
                    .setColor('RANDOM')
                    .setTitle(`:bookmark_tabs: Informações do servidor ${guild.name}`)
                    .addField(':id: ID', guild.id)
                    .addField(':speaker: Canais de voz públicos', guild.channels.length)
                    .addField(`:man: Membros Visíveis [${guild.presence_count}]` + `\n:busts_in_silhouette: Total de membros com o status visível [${guild.presence_count > 99 ? '99' : guild.presence_count}]`,
                        `<:b_online2:585881537493467175> Online: ${online}\n<:b_idle2:585881544124661801> Ausente: ${idle}\n` +
                        `<:b_dnd2:585881517314539523> Ocupado: ${dnd}`)
                    .setTimestamp()
                    .setFooter(message.author.tag, message.author.displayAvatarURL({ dynamic: true }));

                //if (guild.instant_invite) embed.setDescription(`Clique [aqui](${guild.instant_invite}) para se juntar ao servidor.`)
                message.channel.send(embed);
            } else {
                message.channel.send(':x: ID inválido!')
            }
        }
    }
};