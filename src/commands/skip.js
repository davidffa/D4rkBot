module.exports = {
    name: 'skip',
    description: 'Pula a música atual.',
    aliases: ['s', 'pular'], 
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

        if (message.author.id === player.queue.current.requester.id) {
            player.stop();
            if (!player.queue[0]) {
                player.destroy();
                return message.channel.send(':bookmark_tabs: A lista de músicas acabou!');
            }
            message.channel.send(':fast_forward: Música pulada!');
        }else if (message.guild.channels.cache.get(player.voiceChannel).permissionsFor(message.author).has('MOVE_MEMBERS')) {
            player.stop();
            if (!player.queue[0]) {
                player.destroy();
                return message.channel.send(':bookmark_tabs: A lista de músicas acabou!');
            }
            message.channel.send(':fast_forward: Música pulada por um `ADMIN`!');
        }else {
            message.channel.send(':x: Apenas quem requisitou esta música ou alguém com a permissão `Mover Membros` a pode pular!');
        }
    }
}