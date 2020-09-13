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

        if (!player || !player.queue[0])
            return message.channel.send(':x: Não estou a tocar nada de momento!');

        const embed = new MessageEmbed()
                    .setTitle('<a:Labfm:482171966833426432> A Tocar')
                    .setColor('RANDOM')
                    .setDescription(`\`${player.queue[0].title}\` requisitado por \`${player.queue[0].requester.username}#${player.queue[0].requester.discriminator}\` com a duração de \`${mstohour(player.position)}/${mstohour(player.queue[0].duration)}\``)
                    .setURL(player.queue[0].uri)
                    .setFooter(message.author.tag, message.author.displayAvatarURL({ dynamic: true }))
                    .setTimestamp();
        message.channel.send(embed);
    }
}