const currencyConverter = require('@y2nk4/currency-converter');
const { MessageEmbed } = require('discord.js');

module.exports = {
    name: 'currency',
    description: 'Conversor de moeda',
    aliases: ['moeda', 'conversormoeda', 'curr'], 
    category: 'Outros',
    usage: '<de> <para> <valor>',
    cooldown: 3,
    async execute(client, message, args, prefix) {
        if (!args.length || args.length < 3) 
            return message.channel.send(`:x: Argumentos em falta, **Usa:** ${prefix}currency <de> <para> <valor>`);

        if (isNaN(args[2]))
            return message.channel.send(':x: Valor inválido!');

        args[0] = args[0].toUpperCase();
        args[1] = args[1].toUpperCase();

        let converter = new currencyConverter(process.env.CurrConverterAPI);

        try {
            const convertedCurrency = await converter.convert(args[0], args[1], Number(args[2]));

            const embed = new MessageEmbed()
                .setTitle("Conversor Moeda")
                .setColor("RANDOM")
                .addField(`:moneybag: Valor de origem: (${args[0]})`, `\`\`\`${args[2]}\`\`\``)
                .addField(`:moneybag: Valor convertido: (${args[1]})`, `\`\`\`${convertedCurrency}\`\`\``)
                .setFooter(`${message.author.tag}`, message.author.displayAvatarURL({ dynamic: true }))
                .setTimestamp();
                
            message.channel.send(embed);
        }catch (err) {
            if (err.message === 'Currency may be wrong or not supported.')
                message.channel.send(':x: Formato da moeda inválido! Tente: `USD, EUR, BRL, ...`');
            else
                message.channel.send(':x: Ocorreu um erro!');
        }       
    }
}