module.exports = {
    name: 'pause',
    description: 'Pausa a música atual.',
    aliases: ['pausa'],
    category: 'Musica',
    guildOnly: true,
    cooldown: 2,
    execute(client, message) {
        const player = client.music.players.get(message.guild.id);

        if (!player)
            return message.channel.send(':x: Não estou a tocar nada de momento!');

        const voiceChannel = message.member.voice.channel;

        if (!voiceChannel || (voiceChannel && voiceChannel.id !== player.voiceChannel))
            return message.channel.send(':x: Precisas de estar no meu canal de voz para usar esse comando!');

        function pause() {
            if (!player.playing)
                return message.channel.send(':x: A música já está pausada!');

            player.pause(player.playing);

            message.channel.send(':pause_button: Música pausada!');
        }

        if (message.guild.channels.cache.get(player.voiceChannel).permissionsFor(message.author).has('MOVE_MEMBERS')
            || (message.member.voice.channel && message.member.voice.channel.id === player.voiceChannel
                && message.member.voice.channel.members.filter(m => !m.user.bot).size === 1)) {
            return pause();
        }

        const guild = message.guildDB;

        if (guild && guild.djrole) {
            const role = message.guild.roles.cache.get(guild.djrole);

            if (message.member.roles.cache.has(guild.djrole))
                return pause();

            return message.channel.send(`:x: Precisas da permissão \`Mover Membros\` ou do cargo DJ: \`${role.name}\` para usar este comando (ou de estar sozinho com o bot no canal de voz)!`);
        }
        message.channel.send(':x: Apenas quem requisitou esta música ou alguém com a permissão `Mover Membros` a pode pular (ou estar sozinho com o bot no canal de voz)!');
    }
}