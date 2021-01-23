const { MessageAttachment } = require('discord.js');
const { inspect } = require('util');
const { Type } = require('@anishshobith/deeptype');
const fetch = require('node-fetch');

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
        
        function clean(text) {
            if (typeof text === 'string') {
                text = text
                    .replace(/`/g, `\`${String.fromCharCode(8203)}`)
                    .replace(/@/g, `@${String.fromCharCode(8203)}`)
                    .replace(new RegExp(client.token, 'gi'), '****');
            }
            return text;
        }

        try {
            const start = process.hrtime();
            const code = args.join(' ');
            let evaled = eval(code);

            if (evaled instanceof Promise) {
                evaled = await evaled;
            }
            const stop = process.hrtime(start);
            const response = [
                `:outbox_tray: **Output** \`\`\`js\n${clean(inspect(evaled, { depth: 0 }))}\n\`\`\``,
                `<:lang_js:427101545478488076> **Tipo** \`\`\`js\n${new Type(evaled).is}\n\`\`\``,
                `:timer: **Tempo** \`\`\`${((stop[0] * 1e9) + stop[1]) / 1e6}ms \`\`\``
            ];
            
            const res = response.join('\n');

            let msg;

            if (res.length < 2000) {
                msg = await message.channel.send(res);
            }else {
                const body = {
                    files: [{
                        name: 'Eval',
                        content: `//Output:\n${clean(inspect(evaled, { depth: 0 }))}\n//Tipo:\n${new Type(evaled).is}\n//Tempo:\n${((stop[0] * 1e9) + stop[1]) / 1e6}ms`,
                        languageId: 183
                    }]
                }

                const bin = await fetch('https://sourceb.in/api/bins', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(body)
                }).then(res => res.json());

                if (bin.key) {
                    msg = await message.channel.send(`:warning: O output passou dos 2000 caracteres. **Output:** https://sourceb.in/${bin.key}`);
                }else {
                    const file = new MessageAttachment(Buffer.from(res), 'output.txt');
                    msg = await message.channel.send(':warning: O output passou dos 2000 caracteres. Aqui vai o ficheiro com o output!', file);
                }
            }

            await msg.react('751062867444498432');

            const filter = (_r, u) => u.id === message.author.id;
            const collector = msg.createReactionCollector(filter, { max: 1, time: 5 * 60 * 1000 });

            collector.on('collect', async r => {
                switch(r.emoji.name) {
                    case 'x_':
                        if (msg.attachments.size === 1) {
                            return msg.delete();
                        }
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

            collector.on('end', (_c, reason) => {
                if (reason === 'time') {
                    msg.reactions.cache.map(reaction => {
                        reaction.users.remove(client.user.id);
                    });
                }
            });
        } catch (err) {
            message.channel.send(`:x: ERRO: \`\`\`x1\n${clean(err)}\`\`\``);
        }
    }
};