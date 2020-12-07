const { MessageEmbed } = require('discord.js');
const guildDB = require('../../models/guildDB');

module.exports = {
    name: 'ping',
    description: 'Mostra o ping do bot e da API',
    aliases: ['latencia', 'latency'],
    category: 'Info',
    cooldown: 3,
    async execute(client, message) {
        const startDB = process.hrtime();
        await guildDB.findOne({ guildID: message.guild.id });
        const stopDB = process.hrtime(startDB);

        const startMsg = process.hrtime();
        const m = await message.channel.send('<a:load:488757308248293396> A calcular...');
        const stopMsg = process.hrtime(startMsg);

        const pingDB = Math.round(((stopDB[0] * 1e9) + stopDB[1]) / 1e6);
        const pingMsg = Math.round(((stopMsg[0] * 1e9) + stopMsg[1]) / 1e6);

        const embed = new MessageEmbed()
            .setTitle("🏓 **Pong**")
            .setColor("RANDOM")
            .setDescription(`<:bot_bot:568569868358516770> \`${pingMsg}ms\`
                :stopwatch: \`${Math.round(client.ws.ping)}ms\`
                <:MongoDB:773610222602158090> \`${pingDB}ms\`
            `)
            .setFooter(`${message.author.tag}`, message.author.displayAvatarURL({ dynamic: true }))
            .setTimestamp()
        m.edit('', embed)
    },
};