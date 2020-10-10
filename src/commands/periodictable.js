const { MessageEmbed, MessageAttachment } = require('discord.js');

module.exports = {
    name: 'periodictable',
    description: 'Mostra a imagem da tabela periódica',
    aliases: ['tp', 'tabelaperiodica'], 
    category: 'Outros',
    cooldown: 3,
    execute(client, message) {
        const attachment = new MessageAttachment('./src/assets/TP.png');

        const embed = new MessageEmbed()
            .setTitle('Tabela Periódica')
            .setColor('RANDOM')
            .setImage(`attachment://TP.png`)
            .setFooter(`${message.author.tag}`, message.author.displayAvatarURL({ dynamic: true }))
            .setTimestamp();

        message.channel.send({ embed, files: [attachment] });
    }
}