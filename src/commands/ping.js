const { MessageEmbed } = require('discord.js');

module.exports = {
    name: 'ping',
    description: 'Mostra o ping do bot e da API',
    aliases: ['latencia', 'latency'],
    category: 'Info',
    cooldown: 3,
    async execute(client, message) {
        const embed = new MessageEmbed()
            .setTitle("**Ping**")
            .setColor("RANDOM")
            .setDescription("A calcular...")
            const m = await message.channel.send(embed)
            const embed2 = new MessageEmbed()
                .setTitle("🏓 **Pong**")
                .setColor("RANDOM")
                .addField(":watch: BOT: ", `\`\`\`${m.createdTimestamp - message.createdTimestamp}ms\`\`\``)
                .addField(":watch: WebSocket: ", `\`\`\`${Math.round(client.ws.ping)}ms\`\`\``)
                .setFooter(`${message.author.tag}`, message.author.displayAvatarURL({ dynamic: true }))
                .setTimestamp()
            m.edit(embed2)
    },
};