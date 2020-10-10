const { MessageEmbed } = require('discord.js');
const { inspect } = require('util');

module.exports = {
    name: 'eval',
    description: 'Executa um código JavaScript e retorna o seu output',
    aliases: ['e', 'evaluate', 'evl'], 
    usage: '<código>',
    category: 'Desenvolvedor',
    cooldown: 1,
    async execute(client, message, args) {
        if (message.author.id !== '334054158879686657') {
            return message.reply(':x: Não tens permissão!');
        }
        if (!args.length) return message.channel.send(':x: Argumentos em falta! Qual o código para executar?');
        try {
            const code = args.join(' ');
            let evaled = eval(`(async () => {
                ${code}
            })()`);

            if (typeof evaled !== 'string') 
                evaled = inspect(evaled);

            const max = 1977 - code.length; 

            if (evaled.length > max) {
                evaled = evaled.substr(0, max);
                evaled += '\n...'
            }
            
            const embed = new MessageEmbed()
                .setColor('RANDOM')
                .setTitle('EVAL')
                .setDescription(":inbox_tray: **Input**\n" + 
                            `\`\`\`js\n${code}\`\`\`\n` + 
                            ":outbox_tray: **Output**\n" + 
                            `\`\`\`js\n${evaled}\`\`\`\n`
            )
                .setTimestamp()
                .setFooter(message.author.tag, message.author.displayAvatarURL({ dynamic: true }));
            const msg = await message.channel.send(embed);
            await msg.react('751062867444498432');

            const filter = (r, u) => r.me && (u.id === message.author.id);
            const collector = msg.createReactionCollector(filter, { max: 1, time: 60 * 1000 });

            collector.on('collect', async r => {
                switch(r.emoji.name) {
                    case 'x_':
                        if (message.guild.me.hasPermission('MANAGE_MESSAGES'))
                            msg.reactions.removeAll();
                        else {
                            msg.reactions.cache.map(reaction => {
                                reaction.users.remove(client.user.id)
                            });
                        }
                        msg.edit('<a:lab_verificado:643912897218740224> Eval fechada.', { embed: null });  
                        break;
                }
            });
        } catch (err) {
            message.channel.send(`:x: ERRO: ${err.message}`);
        }
    }
};