module.exports = {
    name: 'resume',
    description: 'Retoma a música atual.',
    aliases: ['retomar'], 
    category: 'Musica',
    guildOnly: true,
    cooldown: 2,
    execute(client, message) {
        const player = client.music.players.get(message.guild.id);

        if (!player)
            return message.channel.send(':x: Não estou a tocar nada de momento!');
        
        const voiceChannel = message.member.voice.channel;

        if (voiceChannel && voiceChannel.id && voiceChannel.id !== player.voiceChannel.id)
            return message.channel.send(':x: Precisas de estar no meu canal de voz para usar esse comando!');

        if (player.playing)
            return message.channel.send(':x: A música já está a tocar!');

        player.pause(player.playing);

        message.channel.send(':play_pause: Música retomada!');
    }
}