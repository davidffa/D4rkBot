const { MessageEmbed } = require('discord.js');

module.exports.run = (client, guild) => {
    const embed = new MessageEmbed()
        .setTitle('<:bot_badgebooster:585905184765378568> Entrei num novo servidor')
        .setColor('RANDOM')
        .addField('Nome', `\`${guild.name}\``, true)
        .addField(':crown: Dono', `\`${guild.owner.user.tag}\``, true)
        .addField(':closed_book: ID', `\`${guild.id}\``, true )
        .addField(':man: Membros', `\`${guild.members.cache.size}\``, true)
        .setThumbnail(guild.iconURL({ format: 'png', dynamic: true }))
        .setTimestamp()

    client.users.cache.get('334054158879686657').send(embed);
}