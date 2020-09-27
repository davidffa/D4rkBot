const { MessageEmbed } = require('discord.js');
const mstohour = require('../utils/mstohour');

module.exports = {
    name: 'np',
    description: 'Mostra a música que está a tocar.',
    aliases: ['nowplaying'], 
    category: 'Musica',
    guildOnly: true,
    cooldown: 5,
    execute(client, message) {
        const player = client.music.players.get(message.guild.id);

        if (!player || !player.queue.current)
            return message.channel.send(':x: Não estou a tocar nada de momento!');

        const embed = new MessageEmbed()
                    .setTitle('<a:Labfm:482171966833426432> A Tocar')
                    .setColor('RANDOM')
                    .setDescription(`\`${player.queue.current.title}\` requisitado por \`${player.queue.current.requester.username}#${player.queue.current.requester.discriminator}\` com a duração de \`${mstohour(player.position)}/${mstohour(player.queue.current.duration)}\``)
                    .setURL(player.queue.current.uri)
                    .setFooter(message.author.tag, message.author.displayAvatarURL({ dynamic: true }))
                    .setTimestamp();
        message.channel.send(embed);
    }
}