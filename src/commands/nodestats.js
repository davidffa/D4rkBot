const { MessageEmbed } = require('discord.js');
const msToDate = require('../utils/mstodate');

module.exports = {
    name: 'nodestats',
    description: 'Informações sobre o node do lavalink',
    aliases: ['lavalinkstats'], 
    category: 'Info',
    guildOnly: true,
    cooldown: 10,
    async execute(client, message) { 
        const node = client.music.nodes.first();
        const embed = new MessageEmbed()
            .setColor('RANDOM')
            .setTitle('Status do Node do LavaLink')
            .addField(':id: Nome', `\`${node.options.tag}\``, true)
            .addField(':calendar: Players a tocar', `\`${node.stats.playingPlayers}\``, true)
            .addField('<a:malakoi:478003266815262730> Uptime', `\`${msToDate(node.stats.uptime)}\``, true)
            .addField('<a:carregando:488783607352131585> CPU', `Cores: \`${node.stats.cpu.cores}\`\nLavalink: \`${node.stats.cpu.lavalinkLoad.toFixed(2)}%\`\nSistema: \`${node.stats.cpu.systemLoad.toFixed(2)}%\``, true)
            .addField('<:ram:751468688686841986> RAM', `\`${(node.stats.memory.used / 1024 / 1024).toFixed(0)}\`MB`, true)
            .setTimestamp()
            .setFooter(message.author.tag, message.author.displayAvatarURL({ dynamic: true }));
        message.channel.send(embed);
    }
};