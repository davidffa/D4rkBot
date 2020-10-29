const cc = require('currency-converter')({ CLIENTKEY: process.env.CurrConverterAPI });
const { MessageEmbed } = require('discord.js');

module.exports = {
    name: 'currency',
    description: 'Conversor de moeda',
    aliases: ['moeda', 'conversormoeda', 'curr'], 
    category: 'Outros',
    usage: '<de> <para> <valor>',
    cooldown: 3,
    async execute(client, message, args) {
        if (isNaN(args[2]))
            return message.channel.send(':x: Valor inválido!');

        args[0] = args[0].toUpperCase();
        args[1] = args[1].toUpperCase();

        try {
            const convertedCurrency = await cc.convert(Number(args[2]), args[0], args[1], true);

            const embed = new MessageEmbed()
                .setTitle("Conversor Moeda")
                .setColor("RANDOM")
                .addField(`:moneybag: Valor de origem: (${args[0]})`, `\`\`\`${args[2]}\`\`\``)
                .addField(`:moneybag: Valor convertido: (${args[1]})`, `\`\`\`${convertedCurrency.symbol} ${convertedCurrency.amount}\`\`\``)
                .setFooter(`${message.author.tag}`, message.author.displayAvatarURL({ dynamic: true }))
                .setTimestamp();
                
            message.channel.send(embed);
        }catch (err) {
            message.channel.send(':x: Formato da moeda inválido! Tente: `USD, EUR, BRL, ...`');
        }       
    }
}