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

        if (voiceChannel && voiceChannel.id && voiceChannel.id !== player.voiceChannel.id)
            return message.channel.send(':x: Precisas de estar no meu canal de voz para usar esse comando!');

        if (args[0] === 'track') {
            player.setTrackRepeat(!player.trackRepeat);
            if (player.trackRepeat)
                message.channel.send('<a:lab_verificado:643912897218740224> Música atual em loop!')
            else 
                message.channel.send('<a:lab_verificado:643912897218740224> Loop da música atual desativado!')
        }else if (args[0] === 'queue') {
            player.setQueueRepeat(!player.queueRepeat);
            if (player.queueRepeat)
                message.channel.send('<a:lab_verificado:643912897218740224> Queue em loop!')
            else 
                message.channel.send('<a:lab_verificado:643912897218740224> Loop da Queue desativado!')
        }else {
            message.channel.send(`:x: **Usa:** \`${prefix}loop <track/queue>\``);
        }
    }
}