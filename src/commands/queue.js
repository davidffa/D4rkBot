const { MessageEmbed } = require('discord.js');
const mstohour = require('../utils/mstohour');

module.exports = {
    name: 'queue',
    description: 'Vê as músicas que estão na queue',
    category: 'Musica',
    aliases: ['q'],
    guildOnly: true,
    cooldown: 5,
    async execute(client, message) {
        const player = client.music.players.get(message.guild.id);

        if (!player)
            return message.channel.send(':x: Não estou a tocar nada de momento!');

        const queue = player.queue;

        function getSongDetails(pos1, pos2) {
            const data = [];

            for (let i=pos1; i<=pos2 && queue[i]; i++) {
                data.push(`${i+1}º - \`${queue[i].title}\` (Requisitado por \`${queue[i].requester.tag}\`)`);
            }
            return data.join('\n');
        }

        let page = 1;
        const pages = Math.ceil(queue.size / 10);

        const embed = new MessageEmbed()
            .setColor('RANDOM')
            .setTitle(':bookmark_tabs: Lista de músicas')
            .setDescription(`
                <a:Labfm:482171966833426432> **A tocar:** \`${queue.current.title}\` (Requisitado por \`${queue.current.requester.tag}\`)\n
                :alarm_clock: Tempo total da queue (${mstohour(queue.duration)}) ----- Total de músicas na queue: ${queue.size}\n
                ${getSongDetails(0, 8)}
            `)
            .setTimestamp()
            .setFooter(`Página ${page} de ${pages}`, message.author.displayAvatarURL({ dynamic: true }));

        const msg = await message.channel.send(embed);

        if (queue.size <= 10) return;

        msg.react('⬅️');
        msg.react('➡️');

        const filter = (r, u) => r.me && (u.id === message.author.id);
        const collector = msg.createReactionCollector(filter, { time: 10 * 60 * 1000 });

        collector.on('collect', async r => {
            switch (r.emoji.name) {
                case '⬅️':
                    if (page === 1)
                        return;
                    page--;
                    embed.setDescription(getSongDetails((page-1)*9+1, page*9))
                        .setFooter(`Página ${page} de ${pages}`, message.author.displayAvatarURL({ dynamic: true }));
                    msg.edit(embed);

                    if (message.guild.me.hasPermission('MANAGE_MESSAGES')) {
                        msg.reactions.cache.map(reaction => {
                            reaction.users.remove(message.author.id)
                        });
                    }

                    break;
                case '➡️':
                    if (page === pages)
                        return;
                    page++;
                    embed.setDescription(getSongDetails((page-1)*9+1, page*9))
                        .setFooter(`Página ${page} de ${pages}`, message.author.displayAvatarURL({ dynamic: true }));
                    msg.edit(embed);

                    if (message.guild.me.hasPermission('MANAGE_MESSAGES')) {
                        msg.reactions.cache.map(reaction => {
                            reaction.users.remove(message.author.id)
                        });
                    }

                    break;
            }
        });
    }
}