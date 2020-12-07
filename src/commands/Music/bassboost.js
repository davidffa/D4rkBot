module.exports = {
    name: 'bassboost',
    description: 'Aumenta os graves da música.',
    category: 'Musica',
    guildOnly: true,
    cooldown: 5,
    execute(client, message) {
        const player = client.music.players.get(message.guild.id);

        if (!player)
            return message.channel.send(':x: Não estou a tocar nada de momento!');
        
        const voiceChannel = message.member.voice.channel;

        if (!voiceChannel || (voiceChannel && voiceChannel.id !== player.voiceChannel))
            return message.channel.send(':x: Precisas de estar no meu canal de voz para usar esse comando!');

        if (player.bands[0] === 0) {
            player.setEQ(
                { band: 0, gain: client.levels.get('high') },
                { band: 1, gain: client.levels.get('medium') },
                { band: 2, gain: client.levels.get('medium') }
            );
            message.channel.send('<a:lab_verificado:643912897218740224> Bassboost ativado!');
        }else {
            player.clearEQ();
            message.channel.send('<a:lab_verificado:643912897218740224> Bassboost desativado!');
        }
    }
}