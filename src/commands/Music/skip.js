module.exports = {
    name: 'skip',
    description: 'Pula a música atual.',
    aliases: ['s', 'pular'], 
    category: 'Musica',
    guildOnly: true,
    cooldown: 2,
    async execute(client, message) {
        const player = client.music.players.get(message.guild.id);

        if (!player)
            return message.channel.send(':x: Não estou a tocar nada de momento!');
        
        const voiceChannel = message.member.voice.channel;

        if (!voiceChannel || (voiceChannel && voiceChannel.id !== player.voiceChannel))
            return message.channel.send(':x: Precisas de estar no meu canal de voz para usar esse comando!');

        function stopMusic() { 
            player.stop();
            if (!player.queue[0]) {
                player.destroy();
                return message.channel.send(':bookmark_tabs: A lista de músicas acabou!');
            }
            message.channel.send(':fast_forward: Música pulada!');
        }

        if (message.author.id === player.queue.current.requester.id 
            || message.guild.channels.cache.get(player.voiceChannel).permissionsFor(message.author).has('MOVE_MEMBERS')
            || voiceChannel.size <= 3) {
            stopMusic();
        }else {
            const guild = message.guildDB;
            if (guild && guild.djrole) {
                const role = message.guild.roles.cache.get(guild.djrole);

                if (message.member.roles.cache.has(guild.djrole)) 
                    return stopMusic();
                
                return message.channel.send(`:x: Apenas quem requisitou esta música, alguém com a permissão \`Mover Membros\` ou com o cargo DJ: \`${role.name}\` a pode pular (ou ficar sozinho com o bot no canal de voz)!`);
            }
            message.channel.send(':x: Apenas quem requisitou esta música ou alguém com a permissão `Mover Membros` a pode pular (ou ficar sozinho com o bot no canal de voz)!');
        }
    }
}