const mstohour = require('../utils/mstohour');
const { Manager } = require('erela.js');
const { MessageEmbed } = require('discord.js');
const Spotify = require('erela.js-spotify');

const nodes = [
    {
        identifier: 'Node 1',
        host: process.env.LAVALINKHOST,
        port: Number(process.env.LAVALINKPORT),
        password: process.env.LAVALINKPASSWORD,
        retryAmount: 30,
        retryDelay: 5000,
        secure: false,
    },
]

module.exports.load = (client) => {
    client.music = new Manager({
        nodes,
        autoPlay: true,
        send(id, payload) {
            const guild = client.guilds.cache.get(id);
            if (guild) guild.shard.send(payload);
        },
        plugins: [
            new Spotify({
                clientID: process.env.SPOTIFYCLIENTID,
                clientSecret: process.env.SPOTIFYCLIENTSECRET
            })
        ]
    });

    client.music.on('nodeConnect', async node => {
        console.log(`Node ${node.options.identifier} do Lavalink com o IP ${node.options.host}:${node.options.port} conectado!`);

        /************************** This code is only for lavalinks hosted on heroku **************************/
        const player = client.music.create({
            guild: process.env.TESTGUILDID,
            voiceChannel: process.env.VOICECHANNELID,
            textChannel: process.env.TEXTCHANNELID,
            selfDeafen: true,
            selfMute: true
        });

        player.connect();

        const { tracks } = await client.music.search('https://www.youtube.com/watch?v=KMU0tzLwhbE', client.user);

        player.queue.add(tracks[0]);

        if (!player.playing)
            player.play();
        /*****************************************************************************************************/
    });

    client.music.on('nodeReconnect', node => {
        console.log(`Node ${node.options.identifier} do Lavalink com o IP ${node.options.host}:${node.options.port} re-conectado!`);
    });

    client.music.on('nodeError', (node, error) => {
        console.log(`Ocorreu um erro no Node ${node.options.identifier}. Erro: ${error.message}`);
    });

    client.music.on('nodeDisconnect', (node, error) => {
        console.log(`O node do lavalink ${node.options.identifier} desconectou inesperadamente.`);
    });

    client.music.on('trackStart', (player, track) => {
        /* This code is only for lavalinks hosted on heroku */
        if (player.guild == process.env.TESTGUILDID) {
            setTimeout(() => {
                player.pause(true);
            }, 3000);
            return;
        }
        /***************************************************/

        const embed = new MessageEmbed()
            .setColor("RANDOM")
            .setTitle('<a:Labfm:482171966833426432> A Tocar')
            .addField(":page_with_curl: Nome:", '`' + track.title + '`')
            .addField(":robot: Enviado por:", '`' + track.author + '`')
            .addField(":watch: Duração:", '`' + mstohour(track.duration) + '`')
            .setURL(track.uri)
            .setThumbnail(track.displayThumbnail())
            .setTimestamp()
            .setFooter(player.queue.current.requester.tag, player.queue.current.requester.displayAvatarURL({ dynamic: true }));

        client.channels.cache.get(player.textChannel).send(embed);
    });

    client.music.on('trackStuck', (player, track, message) => {
        client.channels.cache.get(player.textChannel).send(`:x: Ocorreu um erro ao tocar a música ${track.title}. Erro: \`${message.error}\``)
        client.music.players.get(player.guild).destroy();
        console.log(`[Erro] Track Error: ${message.error}`);
    });

    client.music.on('trackError', (player, track, message) => {
        client.channels.cache.get(player.textChannel).send(`:x: Ocorreu um erro ao tocar a música ${track.title}. Erro: \`${message.error}\``)
        if (player.guild === process.env.TESTGUILDID) {
            client.music.players.get(player.guild).destroy();

            setTimeout(async () => {
                /************** This code is only for lavalinks hosted on heroku **************/
                const player = client.music.create({
                    guild: process.env.TESTGUILDID,
                    voiceChannel: process.env.VOICECHANNELID,
                    textChannel: process.env.TEXTCHANNELID,
                    selfDeaf: true,
                    selfMute: true
                });

                player.connect();

                const { tracks } = await client.music.search('https://www.youtube.com/watch?v=KMU0tzLwhbE', client.user);

                player.queue.add(tracks[0]);

                if (!player.playing)
                    player.play();
                /*****************************************************************************/
            }, 5000);
            return;
        }
        client.music.players.get(player.guild).destroy();
        console.log(`[Erro] Track Error: ${message.error}`);
    });

    client.music.on('queueEnd', player => {
        const channel = client.channels.cache.get(player.textChannel);
        if (channel) channel.send(':bookmark_tabs: A lista de músicas acabou!');
        client.music.players.get(player.guild).destroy();
    });

    client.music.init(client.user.id);

    client.on("raw", (d) => client.music.updateVoiceState(d));
}