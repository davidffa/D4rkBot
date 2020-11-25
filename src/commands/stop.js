const guildDB = require('../models/guildDB');

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

        if (message.guild.channels.cache.get(player.voiceChannel).members.size === 1 || (message.member.voice.channel && message.member.voice.channel.id === player.voiceChannel && message.member.voice.channel.members.filter(m => !m.u.bot).size === 1)) {
            player.destroy();

            return message.channel.send('<a:lab_verificado:643912897218740224> Parei de tocar música e saí do canal de voz!');
        }else {
            const guild = await guildDB.findOne({ guildID: message.guild.id });
            if (guild && guild.djrole) {
                const role = message.guild.roles.cache.get(guild.djrole);
                if (message.member.roles.cache.has(guild.djrole)) {
                    player.destroy();

                    return message.channel.send('<a:lab_verificado:643912897218740224> Parei de tocar música e saí do canal de voz!');
                }
                return message.channel.send(`:x: Precisas da permissão \`Mover Membros\` ou do cargo DJ: \`${role.name}\` para usar este comando!`);
            }
        }
        message.channel.send(':x: Precisas da permissão `Mover Membros` para usar este comando!');
    }
}