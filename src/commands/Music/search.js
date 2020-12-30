const { MessageEmbed } = require('discord.js');

module.exports = {
    name: 'search',
    description: 'Procura uma música no YouTube e toca-a.',
    aliases: ['procurar'],
    usage: '<Nome>',
    category: 'Musica',
    args: 1,
    guildOnly: true,
    cooldown: 5,
    async execute(client, message, args) {
        const voiceChannel = message.member.voice.channel;

        if (!voiceChannel)
            return message.channel.send(':x: Precisas de estar num canal de voz para executar esse comando!');

        if (client.music.players.get(message.guild.id) && voiceChannel.id !== client.music.players.get(message.guild.id).voiceChannel)
            return message.channel.send(':x: Precisas de estar no meu canal de voz para usar esse comando!');

        const permissions = voiceChannel.permissionsFor(client.user);

        if (!permissions.has('VIEW_CHANNEL'))
            return message.channel.send(':x: Não tenho permissão para ver o teu canal de voz!');

        if (!permissions.has('CONNECT'))
            return message.channel.send(':x: Não tenho permissão para entrar no teu canal de voz!');

        if (!permissions.has('SPEAK'))
            return message.channel.send(':x: Não tenho permissão para falar no teu canal de voz!');

        if (client.records.get(message.guild.id)) 
            return message.channel.send(':x: Não consigo tocar música enquanto gravo voz!');

        function createPlayer() {
            return client.music.create({
                guild: message.guild.id,
                voiceChannel: voiceChannel.id,
                textChannel: message.channel.id,
                selfDeafen: true
            });
        }

        try {
            const res = await client.music.search(args.join(' '), message.author);

            if (res.loadType === 'SEARCH_RESULT') {
                const resSize = res.tracks.length >= 10 ? 10 : res.tracks.length;
                let desc = '';

                for (let i = 1; i <= resSize; i++) {
                    desc += `${i}º - \`${res.tracks[i - 1].title}\`\n`;
                }

                desc += `Envie mensagem com o número da música, (0 para cancelar procura).`;

                const embed = new MessageEmbed()
                    .setColor("RANDOM")
                    .setTitle(':bookmark_tabs: Resultados da procura')
                    .setDescription(desc)
                    .setTimestamp()
                    .setFooter(message.author.tag, message.author.displayAvatarURL({ dynamic: true }));

                const msg = await message.channel.send(embed);

                if (client.searchMsgCollectors.get(message.author.id)) {
                    client.searchMsgCollectors.get(message.author.id).message.edit(':x: Pesquisa cancelada!', { embed: null });
                    client.searchMsgCollectors.get(message.author.id).collector.stop();
                    client.searchMsgCollectors.delete(message.author.id);
                }

                const filter = m => m.author === message.author && parseInt(m.content) >= 0 && parseInt(m.content) <= resSize;
                const collector = message.channel.createMessageCollector(filter, { max: 1, time: 20000 });

                client.searchMsgCollectors.set(message.author.id, { message: msg, collector });

                collector.on('collect', m => {
                    if (!msg.deleted) msg.delete();

                    if (parseInt(m.content) === 0) 
                        return message.channel.send(':x: Pesquisa cancelada!');    

                    const player = client.music.players.get(message.guild.id) || createPlayer();

                    if (player.state === 'DISCONNECTED') {
                        if (voiceChannel.full) {
                            message.channel.send(':x: O canal de voz está cheio!');
                            return player.destroy();
                        }
                        player.connect();
                    }

                    player.queue.add(res.tracks[parseInt(m.content - 1)]);

                    if (!player.playing)
                        return player.play();
                    else
                        return message.channel.send(`:bookmark_tabs: Adicionado à lista \`${res.tracks[parseInt(m.content - 1)].title}\``);
                });

                collector.on('end', (_c, reason) => {
                    client.searchMsgCollectors.delete(message.author.id);
                    if (reason === 'time') {
                        msg.edit(':x: Pesquisa cancelada!', { embed: null });
                    }
                })
            } else {
                message.channel.send(':x: Não encontrei resultados!');
            }

        } catch (err) {
            console.log(err)
            return message.channel.send(':x: Não encontrei resultados!');
        }
    }
}