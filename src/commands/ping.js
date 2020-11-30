const { MessageEmbed } = require('discord.js');
const guildDB = require('../models/guildDB');

module.exports = {
    name: 'ping',
    description: 'Mostra o ping do bot e da API',
    aliases: ['latencia', 'latency'],
    category: 'Info',
    cooldown: 3,
    async execute(client, message) {
        const start = process.hrtime();
        await guildDB.findOne({ guildID: message.guild.id });
        const stop = process.hrtime(start);

        const pingDB = Math.round(((stop[0] * 1e9) + stop[1]) / 1e6);

        const embed = new MessageEmbed()
            .setTitle("**Ping**")
            .setColor("RANDOM")
            .setDescription("A calcular...")
        const m = await message.channel.send(embed)
        const embed2 = new MessageEmbed()
            .setTitle("🏓 **Pong**")
            .setColor("RANDOM")
            .setDescription(`<:bot_bot:568569868358516770> \`${m.createdTimestamp - message.createdTimestamp}ms\`
                :stopwatch: API \`${Math.round(client.ws.ping)}ms\`
                <:MongoDB:773610222602158090> Database \`${pingDB}ms\`
            `)
            .setFooter(`${message.author.tag}`, message.author.displayAvatarURL({ dynamic: true }))
            .setTimestamp()
        m.edit(embed2)
    },
};