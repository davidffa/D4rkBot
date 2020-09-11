const { ErelaClient } = require('erela.js');
const { MessageEmbed } = require('discord.js');
const mstohour = require('../utils/mstohour');

const nodes = [
    {
        tag: 'Node 1',
        host: process.env.LAVALINKHOST,
        port: process.env.LAVALINKPORT,
        password: process.env.LAVALINKPASSWORD
    },
]

module.exports.run = async (client) => {
    console.log("D4rkBot iniciado");
    console.log(`Utilizadores: ${client.users.cache.size} \nServidores: ${client.guilds.cache.size}`)
    client.user.setActivity("D4rkB", { type: "WATCHING" });

    client.voiceStateTimeouts = new Map(); // Key: guildID, Value: timeout
    client.music = new ErelaClient(client, nodes);

    client.music.on('nodeConnect', async node => {
        console.log(`Node ${node.options.tag} do Lavalink com o IP ${node.options.host}:${node.options.port} conectado!`);

        // This code is only for lavalinks hosted on heroku
        const player = await client.music.players.spawn({
            guild: process.env.TESTGUILDID,
            voiceChannel: process.env.VOICECHANNELID,
            textChannel: client.guilds.cache.get(process.env.TESTGUILDID).channels.cache.get(process.env.TEXTCHANNELID),
            selfDeaf: true,
            selfMute: true
        });

        const { tracks } = await client.music.search('https://www.youtube.com/watch?v=KMU0tzLwhbE', client.user);

        player.queue.add(tracks[0]);

        if (!player.playing)
            player.play();
        //
    });

    client.music.on('nodeReconnect', node => {
        console.log(`Node ${node.options.tag} do Lavalink com o IP ${node.options.host}:${node.options.port} re-conectado!`);
    });

    client.music.on('nodeError', (node, error) => {
        console.log(`Ocorreu um erro no Node ${node.options.tag}. Erro: ${error.message}`);
    });

    client.music.on('nodeDisconnect', (node, error) => {
        console.log(`O node do lavalink ${node.options.tag} desconectou inesperadamente.`);
    });

    client.music.on('trackStart', (player, track) => {
        // This code is only for lavalinks hosted on heroku
        if (player.guild == process.env.TESTGUILDID) {
            setTimeout(() => {
                player.pause(true);
            }, 3000);
            return;
        }
        //

        const embed = new MessageEmbed()
            .setColor("RANDOM")
            .setTitle('<a:Labfm:482171966833426432> A Tocar')
            .addField(":page_with_curl: Nome:", '`' + track.title + '`')
            .addField(":robot: Enviado por:", '`' + track.author + '`')
            .addField(":watch: Duração:", '`' + mstohour(track.duration) + '`')
            .setURL(track.uri)
            .setThumbnail(`https://i.ytimg.com/vi/${track.identifier}/maxresdefault.jpg`)
            .setTimestamp()
            .setFooter(player.queue[0].requester.tag, player.queue[0].requester.displayAvatarURL({ dynamic: true }));

        player.textChannel.send(embed);
    });

    client.music.on('trackStuck', (player, track, message) => {
        player.textChannel.send(`:x: Ocorreu um erro ao tocar a música ${track.title}. Erro: \`${message.error}\``)
        client.music.players.destroy(player.guild);
        console.log(`[Erro] Track Error: ${message.error}`);
    });

    client.music.on('trackError', (player, track, message) => {
        player.textChannel.send(`:x: Ocorreu um erro ao tocar a música ${track.title}. Erro: \`${message.error}\``)
        if (player.guild === process.env.TESTGUILDID) {
            client.music.players.destroy(player.guild);

            setTimeout(async () => {
                // This code is only for lavalinks hosted on heroku
                const player = await client.music.players.spawn({
                    guild: process.env.TESTGUILDID,
                    voiceChannel: process.env.VOICECHANNELID,
                    textChannel: client.guilds.cache.get(process.env.TESTGUILDID).channels.cache.get(process.env.TEXTCHANNELID),
                    selfDeaf: true,
                    selfMute: true
                });

                const { tracks } = await client.music.search('https://www.youtube.com/watch?v=KMU0tzLwhbE', client.user);

                player.queue.add(tracks[0]);

                if (!player.playing)
                    player.play();
                //
            }, 5000);
            return;
        }
        client.music.players.destroy(player.guild);
        console.log(`[Erro] Track Error: ${message.error}`);
    });

    client.music.on('queueEnd', player => {
        player.textChannel.send(':bookmark_tabs: A lista de músicas acabou!');
        client.music.players.destroy(player.guild);
    });

    client.levels = new Map()
        .set('none', 0.0)
        .set('low', 0.10)
        .set('medium', 0.15)
        .set('high', 0.25);
}