const { MessageEmbed } = require('discord.js');
const mstohour = require('../../utils/mstohour');

module.exports = {
    name: 'play',
    description: 'Toca uma música ou adiciona-a na lista de músicas.',
    aliases: ['p', 'tocar'], 
    usage: '<Nome/URL>',
    category: 'Musica',
    args: 1,
    guildOnly: true,
    cooldown: 1,
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

            if (res.loadType === 'LOAD_FAILED' || res.loadType === 'NO_MATCHES') {
                message.channel.send(':x: Música não encontrada!');
            }else if (res.loadType === 'PLAYLIST_LOADED') {
                const player = client.music.players.get(message.guild.id) || createPlayer();

                if (player.state === 'DISCONNECTED') {
                    if (voiceChannel.full) {
                        message.channel.send(':x: O canal de voz está cheio!');
                        return player.destroy();
                    }
                    player.connect();
                }

                const playlist = res.playlist;
                for (const track of res.tracks) 
                    player.queue.add(track);

                if (!player.playing) 
                    player.play();

                const embed = new MessageEmbed()
                        .setColor("RANDOM")
                        .setTitle('<a:Labfm:482171966833426432> Playlist Carregada')
                        .addField(":page_with_curl: Nome:", '`' + playlist.name + '`')
                        .addField("<a:malakoi:478003266815262730> Quantidade de músicas:", '`' + res.tracks.length + '`')
                        .addField(':watch: Duração', `\`${mstohour(res.playlist.duration)}\``)
                        .setTimestamp()
                        .setFooter(message.author.tag, message.author.displayAvatarURL({ dynamic: true }));

                const urlRegex = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/

                urlRegex.test(args[0]) && embed.setURL(args[0]);
                
                message.channel.send(embed);

            }else {
                const player = client.music.players.get(message.guild.id) || createPlayer();

                if (player.state === 'DISCONNECTED') {
                    if (voiceChannel.full) {
                        message.channel.send(':x: O canal de voz está cheio!');
                        return player.destroy();
                    }
                    player.connect();
                }
                    
                const tracks = res.tracks;

                player.queue.add(tracks[0]);

                if (!player.playing) 
                    return player.play();
                else
                    return message.channel.send(`:bookmark_tabs: Adicionado à lista \`${tracks[0].title}\``);
            }
            
        }catch (err) {
            console.log(err)
            return message.channel.send(':x: Música não encontrada!');
        }
    }
}