const { MessageEmbed } = require('discord.js');
const { getLyrics, searchSong } = require('genius-lyrics-api')

module.exports = {
    name: 'lyrics',
    description: 'Mostra a letra de uma música.',
    aliases: ['letra'],
    category: 'Musica',
    guildOnly: true,
    args: 1,
    usage: '<Nome da música> - <Artista>',
    cooldown: 5,
    async execute(client, message, args) {
        const data = args.join(' ').split('-');

        if (data.length < 2)
            return message.channel.send('Use `<Nome da música> - <Artista>`');

        const title = data[0].trim();
        const artist = data[1].trim();

        const ops = {
            apiKey: process.env.GENIUSLYRICSTOKEN,
            title,
            artist,
            optimizeQuery: true
        };

        const res = await searchSong(ops);

        if (!res)
            return message.channel.send(':x: Não encontrei nenhum resultado!');

        const lyrics = await getLyrics(res[0].url)
        let page = 1;
        const pages = Math.ceil(lyrics.length / 800);

        const embed = new MessageEmbed()
            .setColor('RANDOM')
            .setTitle(args.join(' '))
            .setDescription(lyrics.slice(0, 800))
            .setThumbnail(res[0].albumArt)
            .setURL(res[0].url)
            .setTimestamp()
            .setFooter(`Página ${page} de ${pages}`, message.author.displayAvatarURL({ dynamic: true }));

        const msg = await message.channel.send(embed);
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
                    embed.setDescription(lyrics.slice((page-1) * 800, page * 800))
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
                    embed.setDescription(lyrics.slice((page-1) * 800, page * 800))
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