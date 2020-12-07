module.exports = {
    name: 'loop',
    description: 'Repete a queue ou música atual.',
    aliases: ['repeat'],
    category: 'Musica',
    guildOnly: true,
    usage: '<track/queue>',
    args: 1,
    cooldown: 3,
    execute(client, message, args, prefix) {
        const player = client.music.players.get(message.guild.id);

        if (!player)
            return message.channel.send(':x: Não estou a tocar nada de momento!');

        const voiceChannel = message.member.voice.channel;

        if (!voiceChannel || (voiceChannel && voiceChannel.id !== player.voiceChannel))
            return message.channel.send(':x: Precisas de estar no meu canal de voz para usar esse comando!');

        function loop() {
            if (args[0] === 'track') {
                player.setTrackRepeat(!player.trackRepeat);
                if (player.trackRepeat)
                    message.channel.send('<a:lab_verificado:643912897218740224> Música atual em loop!')
                else
                    message.channel.send('<a:lab_verificado:643912897218740224> Loop da música atual desativado!')
            } else if (args[0] === 'queue') {
                player.setQueueRepeat(!player.queueRepeat);
                if (player.queueRepeat)
                    message.channel.send('<a:lab_verificado:643912897218740224> Queue em loop!')
                else
                    message.channel.send('<a:lab_verificado:643912897218740224> Loop da Queue desativado!')
            } else {
                message.channel.send(`:x: **Usa:** \`${prefix}loop <track/queue>\``);
            }
        }

        if (message.guild.channels.cache.get(player.voiceChannel).permissionsFor(message.author).has('MOVE_MEMBERS') 
            || message.guild.channels.cache.get(player.voiceChannel).members.size === 1 
            || (message.member.voice.channel && message.member.voice.channel.id === player.voiceChannel 
                && message.member.voice.channel.members.filter(m => !m.user.bot).size === 1)) {
            loop();
        } else {
            const guild = message.guildDB;
            if (guild && guild.djrole) {
                const role = message.guild.roles.cache.get(guild.djrole);
                if (message.member.roles.cache.has(guild.djrole)) {
                    loop();
                }
                return message.channel.send(`:x: Precisas da permissão \`Mover Membros\` ou do cargo DJ: \`${role.name}\` para usar este comando (ou de estar sozinho com o bot no canal de voz)!`);
            }
            message.channel.send(':x: Apenas quem requisitou esta música ou alguém com a permissão `Mover Membros` a pode pular (ou estar sozinho com o bot no canal de voz)!');
        }
    }
}