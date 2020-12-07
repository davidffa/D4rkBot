const translate = require('@k3rn31p4nic/google-translate-api');
const { MessageEmbed } = require('discord.js');

module.exports = {
    name: 'translate',
    description: 'Traduz uma palavra ou frase',
    aliases: ['traduzir'], 
    category: 'Outros',
    args: 2,
    usage: '<para> <texto>',
    cooldown: 3,
    async execute(_client, message, args) {
        const originText = args.slice(1).join(' ');

        try {
            const res = await translate(originText, {
                to: args[0]
            });

            const embed = new MessageEmbed()
                .setTitle("Tradutor")
                .setColor("RANDOM")
                .addField(`:bookmark: Texto de origem: (${res.from.language.iso})`, `\`\`\`${originText}\`\`\``)
                .addField(`:book: Texto traduzido: (${args[0]})`, `\`\`\`${res.text ? res.text : ''}\`\`\``)
                .setFooter(`${message.author.tag}`, message.author.displayAvatarURL({ dynamic: true }))
                .setThumbnail('https://upload.wikimedia.org/wikipedia/commons/thumb/d/d7/Google_Translate_logo.svg/250px-Google_Translate_logo.svg.png')
                .setTimestamp();

            message.channel.send(embed);
        }catch (err) {
            if (err.message.startsWith('The language') && err.message.endsWith('is not supported.')) 
                return message.channel.send(':x: Linguagem não suportada! Tente `en, pt, fr, ...`')
            return message.channel.send(':x: Ocorreu um erro!');
        }
    }
}