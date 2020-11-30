const { exec } = require('child_process');

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
            const msg = err ? await message.channel.send(`:x: Erro:\n\`\`\`${err}\`\`\``) : await message.channel.send(`:outbox_tray: Output:\n\`\`\`${stdout}\`\`\``);
            await msg.react('751062867444498432');

            const filter = (r, u) => r.me && (u.id === message.author.id);
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
                    if (!msg.deleted) {
                        msg.reactions.cache.map(reaction => {
                            reaction.users.remove(client.user.id)
                        });
                    }
                }
            });
        });
    }
};