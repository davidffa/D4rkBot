const { MessageEmbed } = require('discord.js');

module.exports = {
    name: 'ping',
    description: 'Mostra o ping do bot e da API',
    aliases: ['latencia', 'latency'],
    category: 'Info',
    guildOnly: true,
    cooldown: 3,
    async execute(client, message) {
        const startMsg = process.hrtime();
        const m = await message.channel.send('<a:load:488757308248293396> A calcular...');
        const stopMsg = process.hrtime(startMsg);

        const pingMsg = Math.round(((stopMsg[0] * 1e9) + stopMsg[1]) / 1e6);

        const embed = new MessageEmbed()
            .setTitle("🏓 **Pong**")
            .setColor("RANDOM")
            .setDescription(`<:bot_bot:568569868358516770> \`${pingMsg}ms\`
                :stopwatch: \`${Math.round(client.ws.ping)}ms\`
                <:MongoDB:773610222602158090> \`${message.pingDB}ms\`
            `)
            .setFooter(`${message.author.tag}`, message.author.displayAvatarURL({ dynamic: true }))
            .setTimestamp()
        m.edit('', embed)
    },
};