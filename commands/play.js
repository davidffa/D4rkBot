module.exports = {
    name: 'play',
    description: 'Toca uma música ou adiciona-a na lista de músicas.',
    aliases: ['p', 'tocar'], 
    usage: '<Nome/URL>',
    category: 'Musica',
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
        
        const player = await client.music.players.spawn({
            guild: message.guild.id,
            voiceChannel,
            textChannel: message.channel,
            selfDeaf: true
        });

        try {
            const { tracks } = await client.music.search(args.join(' '), message.author);

            player.queue.add(tracks[0]);

            if (!player.playing) 
                return player.play();
            else
                return message.channel.send(`:bookmark_tabs: Adicionado à lista \`${tracks[0].title}\``);
        }catch (err) {
            console.log(err)
            return message.channel.send(':x: Música não encontrada!');
        }
    }
}