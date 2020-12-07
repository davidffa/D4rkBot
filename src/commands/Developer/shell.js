const { exec } = require('child_process');
const fetch = require('node-fetch');

module.exports = {
    name: 'shell',
    description: 'Executa um comando no terminal e retorna o seu output',
    aliases: ['sh'],
    usage: '<comando>',
    category: 'Desenvolvedor',
    cooldown: 1,
    execute(client, message, args) {
        if (message.author.id !== '334054158879686657') {
            return message.reply(':x: Não tens permissão!');
        }
        if (!args.length) return message.channel.send(':x: Argumentos em falta! Qual o comando a executar?');

        exec(args.join(' '), async (err, stdout) => { 
            let msg;
            if (stdout.length + 15 < 2000) {
                msg = err ? await message.channel.send(`:x: Erro:\`\`\`sh\n${err}\`\`\``) : await message.channel.send(`:outbox_tray: **Output:**\`\`\`sh\n${stdout}\n\`\`\``);
            }else {
                const body = {
                    files: [{
                        name: 'Shell',
                        content: err ? `//Erro:\n${err}` : `//Output:\n${stdout}`,
                        languageId: 346
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
                switch (r.emoji.name) {
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
                        msg.edit('<a:lab_verificado:643912897218740224> Shell fechada.', { embed: null });
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
        });
    }
};