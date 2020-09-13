const { MessageEmbed } = require('discord.js');
const { getData } = require('spotify-url-info');

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

        const permissions = voiceChannel.permissionsFor(client.user);

        if (!permissions.has('CONNECT'))
            return message.channel.send(':x: Não tenho permissão para entrar no teu canal de voz!');

        if (!permissions.has('SPEAK'))
            return message.channel.send(':x: Não tenho permissão para falar no teu canal de voz!');
        
        const spotifyRegex = /^(https:\/\/open.spotify.com\/playlist\/|https:\/\/open.spotify.com\/track\/|https:\/\/open.spotify.com\/album\/|spotify:playlist:|spotify:track:|spotify:album:)([a-zA-Z0-9]+)(.*)$/

        if (spotifyRegex.test(args[0])) {
            let data;
            try {
                data = await getData(args[0]);
            }catch (err) {}

            if (data.type === 'track') {
                args = [data.name, data.artists[0].name]
            }else {
                const msg = await message.channel.send('<a:lab_loading:643912893011853332> A carregar playlist.');
                const player = await client.music.players.spawn({
                    guild: message.guild.id,
                    voiceChannel,
                    textChannel: message.channel,
                    selfDeaf: true
                });
                
                for (const track of data.tracks.items) {
                    try {
                        let tracks;
                        if (data.type === 'playlist') 
                            tracks = await client.music.search(`${track.track.name} ${track.track.artists[0].name}`, message.author);
                        else 
                            tracks = await client.music.search(`${track.name} ${track.artists[0].name}`, message.author);

                        player.queue.add(tracks.tracks[0]);

                        if (!player.playing) 
                            player.play();
                    }catch (err) {
                        continue;
                    }   
                }   
    
                const embed = new MessageEmbed()
                    .setColor("RANDOM")
                    .setTitle('<a:Labfm:482171966833426432> Playlist Carregada')
                    .addField(":page_with_curl: Nome:", '`' + data.name + '`')
                    .addField("<a:malakoi:478003266815262730> Quantidade de músicas:", '`' + data.tracks.total + '`')
                    .setURL(data.external_urls.spotify)
                    .setTimestamp()
                    .setFooter(message.author.tag, message.author.displayAvatarURL({ dynamic: true }));
                    
                return msg.edit('', embed);
            }
        }

        try {
            const res = await client.music.search(args.join(' '), message.author);

            const player = await client.music.players.spawn({
                guild: message.guild.id,
                voiceChannel,
                textChannel: message.channel,
                selfDeaf: true
            });
            
            if (res.loadType === 'PLAYLIST_LOADED') {
                const playlist = res.playlist;
                for (const track of playlist.tracks) 
                    player.queue.add(track);

                if (!player.playing) 
                    player.play();

                const embed = new MessageEmbed()
                        .setColor("RANDOM")
                        .setTitle('<a:Labfm:482171966833426432> Playlist Carregada')
                        .addField(":page_with_curl: Nome:", '`' + playlist.info.name + '`')
                        .addField("<a:malakoi:478003266815262730> Quantidade de músicas:", '`' + playlist.tracks.length + '`')
                        .setURL(args[0])
                        .setTimestamp()
                        .setFooter(message.author.tag, message.author.displayAvatarURL({ dynamic: true }));
                
                message.channel.send(embed);

            }else {
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