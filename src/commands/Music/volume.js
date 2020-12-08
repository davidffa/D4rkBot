module.exports = {
    name: 'volume',
    description: 'Muda o volume da música',
    category: 'Musica',
    aliases: ['vol'],
    usage: '[volume (1/100)]',
    guildOnly: true,
    cooldown: 3,
    execute(client, message, args) {
        const player = client.music.players.get(message.guild.id);

        if (!player)
            return message.channel.send(':x: Não estou a tocar nada de momento!');

        const voiceChannel = message.member.voice.channel;

        if (!voiceChannel || (voiceChannel && voiceChannel.id !== player.voiceChannel))
            return message.channel.send(':x: Precisas de estar no meu canal de voz para usar esse comando!');

        if (!args[0])
            return message.channel.send(`:speaker: Volume atual \`${player.volume}\``)

        function setVolume() {
            if (Number(args[0]) <= 0 || Number(args[0]) > 100)
                return message.channel.send(':x: O volume pode variar apenas <1/100>');

            player.setVolume(Number(args[0]));

            message.channel.send(`:speaker: Volume da música setado para \`${Number(args[0])}\``);
        }

        if (message.author.id === player.queue.current.requester.id
            || message.guild.channels.cache.get(player.voiceChannel).permissionsFor(message.author).has('MOVE_MEMBERS')
            || (message.member.voice.channel && message.member.voice.channel.id === player.voiceChannel
                && message.member.voice.channel.members.filter(m => !m.user.bot).size === 1)) {
            return setVolume();
        }
        
        const guild = message.guildDB;

        if (guild && guild.djrole) {
            const role = message.guild.roles.cache.get(guild.djrole);

            if (message.member.roles.cache.has(guild.djrole))
                return setVolume();
            
            return message.channel.send(`:x: Apenas quem requisitou esta música, alguém com o cargo DJ: \`${role.name}\` ou com a permissão \`Mover Membros\` pode usar este comando (ou de estar sozinho com o bot no canal de voz)!`);
        }
        message.channel.send(':x: Apenas quem requisitou esta música ou alguém com a permissão `Mover Membros` a pode pular (ou estar sozinho com o bot no canal de voz)!');
    }
}