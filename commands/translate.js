const translate = require('@k3rn31p4nic/google-translate-api');
const { MessageEmbed } = require('discord.js');

module.exports = {
    name: 'translate',
    description: 'Traduz uma palavra ou frase',
    aliases: ['traduzir'], 
    category: 'Outros',
    usage: '<de> <para> <texto>',
    cooldown: 3,
    async execute(client, message, args, prefix) {
        if (!args.length || args.length < 3) 
            return message.channel.send(`:x: Argumentos em falta, **Usa:** ${prefix}translate <de> <para> <texto>`);

        const originTextArray = args.slice();
        originTextArray.shift();
        originTextArray.shift();
        const originText = originTextArray.join(' ');

        let text = '';

        try {
            text = await translate(originText, {
                from: args[0],
                to: args[1],
            });
        }catch (err) {
            if (err.message.startsWith('The language') && err.message.endsWith('is not supported.')) 
                return message.channel.send(':x: Linguagem não suportada! Tente `en, pt, fr, ...`')
            return message.channel.send(':x: Ocorreu um erro!');
        }

        const embed = new MessageEmbed()
            .setTitle("TRADUTOR")
            .setColor("RANDOM")
            .addField(`:bookmark: Texto de origem: (${args[0]})`, `\`\`\`${originText}\`\`\``)
            .addField(`:book: Texto traduzido: (${args[1]})`, `\`\`\`${text.text}\`\`\``)
            .setFooter(`${message.author.tag}`, message.author.displayAvatarURL())
            .setTimestamp()
        message.channel.send(embed);
    }
}