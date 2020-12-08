module.exports = {
    name: 'stop',
    description: 'Para a música atual, sai do canal de voz e limpa a lista de músicas.',
    aliases: ['parar', 'disconnect', 'desconectar', 'leave', 'sair', 'quit'],
    category: 'Musica',
    guildOnly: true,
    cooldown: 5,
    async execute(client, message) {
        const player = client.music.players.get(message.guild.id);

        if (!player)
            return message.channel.send(':x: Não estou a tocar nada de momento!');

        function stop() {
            player.destroy();

            return message.channel.send('<a:lab_verificado:643912897218740224> Parei de tocar música e saí do canal de voz!');
        }

        if (message.guild.channels.cache.get(player.voiceChannel).permissionsFor(message.author).has('MOVE_MEMBERS')
            || (message.member.voice.channel && message.member.voice.channel.id === player.voiceChannel
                && message.member.voice.channel.members.filter(m => !m.user.bot).size === 1)) {
            return stop();
        }

        const guild = message.guildDB;

        if (guild && guild.djrole) {
            const role = message.guild.roles.cache.get(guild.djrole);

            if (message.member.roles.cache.has(guild.djrole))
                return stop();

            return message.channel.send(`:x: Precisas da permissão \`Mover Membros\` ou do cargo DJ: \`${role.name}\` para usar este comando (ou de estar sozinho com o bot no canal de voz)!`);
        }
        message.channel.send(':x: Apenas quem requisitou esta música ou alguém com a permissão `Mover Membros` a pode pular (ou estar sozinho com o bot no canal de voz)!');
    }
}