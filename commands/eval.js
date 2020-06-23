const { MessageEmbed } = require('discord.js');

module.exports = {
    name: 'eval',
    description: 'Executa um código JavaScript e retorna o seu output',
    aliases: ['e', 'evaluate'], 
    usage: '<código>',
    category: 'Desenvolvedor',
    cooldown: 1,
    execute(client, message, args) {
        if (message.author.id !== '334054158879686657') {
            return message.reply(':x: Não tens permissão!');
        }
        if (!args.length) return message.channel.send(':x: Argumentos em falta! Qual o código para executar?');
        try {
            const code = args.join(' ');
            let evaled = eval(code);

            if (typeof evaled !== 'string') 
                evaled = require('util').inspect(evaled);
            
            const embed = new MessageEmbed()
                .setColor('RANDOM')
                .setTitle('EVAL')
                .setDescription(":inbox_tray: **Input**\n" + 
                            `\`\`\`js\n${code}\`\`\`\n` + 
                            ":outbox_tray: **Output**\n" + 
                            `\`\`\`js\n${evaled}\`\`\`\n`
            )
                .setTimestamp()
                .setFooter(message.author.tag, message.author.displayAvatarURL());
            message.channel.send(embed);
        } catch (err) {
            message.channel.send(`:x: ERRO: ${err.message}`);
        }
    }
};