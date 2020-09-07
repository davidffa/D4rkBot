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

        if (!voiceChannel || (voiceChannel && voiceChannel.id !== player.voiceChannel.id))
            return message.channel.send(':x: Precisas de estar no meu canal de voz para usar esse comando!');

        if (!player.playing)
            return message.channel.send(':x: A música já está pausada!');

        player.pause(player.playing);

        message.channel.send(':pause_button: Música pausada!');
    }
}