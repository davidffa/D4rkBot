const { MessageEmbed } = require('discord.js');
const osu = require('node-os-utils');
const msToDate = require('../utils/mstodate');

module.exports = {
    name: 'botinfo',
    description: 'Informações sobre o bot',
    aliases: ['info'], 
    category: 'Info',
    guildOnly: true,
    cooldown: 10,
    async execute(client, message, args, prefix) { 
        const cpu = osu.cpu;
        const ram = osu.mem;
        const cpuUsage = await cpu.usage();
        
        //HEROKU
        const nonMem = (await ram.info()).totalMemMb - 512;
        const usedMem = await (await ram.info()).usedMemMb * 1024 - nonMem;
        const totalMem = 512/*await (await ram.info()).totalMemMb * 1024*/;
        const embed = new MessageEmbed()
            .setColor('RANDOM')
            .setTitle('BotInfo')
            .setDescription('<a:lab_blobdance:643917533136814087> Adiciona me no teu servidor [aqui](https://discordapp.com/oauth2/authorize?client_id=499901597762060288&scope=bot&permissions=8)')
            .addField(':calendar: Criado em', `\`${client.user.createdAt}\``, true)
            .addField(':closed_book: Meu ID', '`499901597762060288`', true)
            .addField(':man: Dono', '`D4rkB#2408`', true)
            .addField('<a:malakoi:478003266815262730> Uptime', `\`${msToDate(client.uptime)}\``, true)
            .addField('Servidores em que estou', `\`${client.guilds.cache.size}\``, true)
            .addField(':ping_pong: Ping da API', `\`${Math.round(client.ws.ping)}ms\``, true)
            .addField('<:bot_badgehypesquad:590943982436089858> Prefixos', `Padrão: \`.\`\n No servidor: \`${prefix}\``, true)
            .addField('<:lang_js:427101545478488076> Versão NodeJS', '`v12.18.1`', true)
            .addField('<a:lab_blobdiscord:643917538555854849> Versão do Discord.js', '`v12.2.0`', true)
            .addField('Banco de dados NoSql', '`MongoDB`', true)
            .addField('<a:carregando:488783607352131585> CPU', `\`${cpuUsage}\` %`, true)
            .addField('RAM', `\`${usedMem}MB / ${totalMem}MB\``, true)
            .setTimestamp()
            .setFooter(message.author.tag, message.author.displayAvatarURL());
        message.channel.send(embed);
    }
};