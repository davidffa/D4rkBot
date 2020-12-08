module.exports = {
    name: 'bassboost',
    description: 'Aumenta os graves da música.',
    category: 'Musica',
    aliases: ['bass', 'grave'],
    guildOnly: true,
    cooldown: 5,
    execute(client, message) {
        const player = client.music.players.get(message.guild.id);

        if (!player)
            return message.channel.send(':x: Não estou a tocar nada de momento!');

        const voiceChannel = message.member.voice.channel;

        if (!voiceChannel || (voiceChannel && voiceChannel.id !== player.voiceChannel))
            return message.channel.send(':x: Precisas de estar no meu canal de voz para usar esse comando!');

        function bassboost() {
            if (player.bands[0] === 0) {
                player.setEQ(
                    { band: 0, gain: client.levels.get('high') },
                    { band: 1, gain: client.levels.get('medium') },
                    { band: 2, gain: client.levels.get('medium') }
                );
                message.channel.send('<a:lab_verificado:643912897218740224> Bassboost ativado!');
            } else {
                player.clearEQ();
                message.channel.send('<a:lab_verificado:643912897218740224> Bassboost desativado!');
            }
        }

        if (message.author.id === player.queue.current.requester.id
            || message.guild.channels.cache.get(player.voiceChannel).permissionsFor(message.author).has('MOVE_MEMBERS')
            || (message.member.voice.channel && message.member.voice.channel.id === player.voiceChannel
                && message.member.voice.channel.members.filter(m => !m.user.bot).size === 1)) {
            return bassboost();
        }
        
        const guild = message.guildDB;

        if (guild && guild.djrole) {
            const role = message.guild.roles.cache.get(guild.djrole);

            if (message.member.roles.cache.has(guild.djrole))
                return bassboost();
            
            return message.channel.send(`:x: Apenas quem requisitou esta música, alguém com o cargo DJ: \`${role.name}\` ou com a permissão \`Mover Membros\` pode usar este comando (ou de estar sozinho com o bot no canal de voz)!`);
        }
        message.channel.send(':x: Apenas quem requisitou esta música ou alguém com a permissão `Mover Membros` a pode pular (ou estar sozinho com o bot no canal de voz)!');
    }
}