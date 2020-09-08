const { MessageEmbed } = require('discord.js');

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