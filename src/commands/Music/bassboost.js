module.exports = {
    name: 'bassboost',
    description: 'Aumenta os graves da música.',
    category: 'Musica',
    aliases: ['bass'],
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

        if (message.guild.channels.cache.get(player.voiceChannel).members.size === 1 || (message.member.voice.channel && message.member.voice.channel.id === player.voiceChannel && message.member.voice.channel.members.filter(m => !m.user.bot).size === 1)) {
            bassboost();
        } else {
            const guild = message.guildDB;
            if (guild && guild.djrole) {
                const role = message.guild.roles.cache.get(guild.djrole);
                if (message.member.roles.cache.has(guild.djrole)) {
                    bassboost();
                }
                return message.channel.send(`:x: Precisas da permissão \`Mover Membros\` ou do cargo DJ: \`${role.name}\` para usar este comando!`);
            }
        }
        message.channel.send(':x: Precisas da permissão `Mover Membros` para usar este comando!');
    }
}