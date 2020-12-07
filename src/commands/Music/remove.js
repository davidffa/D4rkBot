module.exports = {
    name: 'remove',
    description: 'Remove uma música da queue',
    category: 'Musica',
    aliases: ['r'],
    guildOnly: true,
    usage: '<Posição>',
    args: 1,
    cooldown: 3,
    execute(client, message, args) {
        const player = client.music.players.get(message.guild.id);

        if (!player)
            return message.channel.send(':x: Não estou a tocar nada de momento!');

        const voiceChannel = message.member.voice.channel;

        if (!voiceChannel || (voiceChannel && voiceChannel.id !== player.voiceChannel))
            return message.channel.send(':x: Precisas de estar no meu canal de voz para usar esse comando!');

        function remove() {
            const pos = parseInt(args[0]);

            if (!player.queue.length) 
                return message.channel.send(':x: Não há músicas na queue');

            if (!pos || pos <= 0 || pos > player.queue.length)
                return message.channel.send(`:x: Número inválido! Tente um número entre 1 e ${player.queue.length}`);

            player.queue.remove(pos-1);
            message.channel.send(`<a:lab_verificado:643912897218740224> Música na posição ${pos} removida!`);
        }

        if (message.guild.channels.cache.get(player.voiceChannel).permissionsFor(message.author).has('MOVE_MEMBERS') 
            || message.guild.channels.cache.get(player.voiceChannel).members.size === 1 
            || (message.member.voice.channel && message.member.voice.channel.id === player.voiceChannel 
                && message.member.voice.channel.members.filter(m => !m.user.bot).size === 1)) {
            remove();
        } else {
            const guild = message.guildDB;
            if (guild && guild.djrole) {
                const role = message.guild.roles.cache.get(guild.djrole);
                if (message.member.roles.cache.has(guild.djrole)) {
                    remove();
                }
                return message.channel.send(`:x: Precisas da permissão \`Mover Membros\` ou do cargo DJ: \`${role.name}\` para usar este comando (ou de estar sozinho com o bot no canal de voz)!`);
            }
            message.channel.send(':x: Apenas quem requisitou esta música ou alguém com a permissão `Mover Membros` a pode pular (ou estar sozinho com o bot no canal de voz)!');
        }
    }
}