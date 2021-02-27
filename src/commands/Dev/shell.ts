import Command from '../../structures/Command';
import Client from '../../structures/Client';

import { Message, Emoji, Member } from 'eris';
import { ReactionCollector } from 'eris-collector';

import fetch from 'node-fetch';
import { exec } from 'child_process';

class Shell extends Command {
    constructor(client: Client) {
        super(client, {
            name: 'shell',
            description: 'Executa um comando no terminal e retorna o seu resultado',
            aliases: ['sh'],
            args: 1,
            dm: true,
            usage: '<comando>',
            category: 'Dev',
        });
    }

    execute(message: Message, args: Array<string>) {
        if (message.author.id !== '334054158879686657') return;

        exec(args.join(' '), async (_err, stdout, stderr) => {
            if (!stdout && !stderr) {
                message.channel.createMessage(':warning: Sem output!');
                return;
            }

            let msg: Message;

            const res = stdout || stderr;

            if (res.length + 15 < 2e3) {
                if (stderr) {
                    msg = await message.channel.createMessage(`:x: Erro: \`\`\`sh\n${res}\`\`\``);
                }else {
                    msg = await message.channel.createMessage(`:outbox_tray: **Output:**\`\`\`sh\n${res}\n\`\`\``);
                }
            }else {
                const body = {
                    files: [{
                        name: 'Shell output result',
                        content: res,
                        languageId: 346
                    }]
                };

                const bin = await fetch('https://sourceb.in/api/bins', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(body)
                }).then(res => res.json());

                if (bin.key) {
                    msg = await message.channel.createMessage(`:warning: O output passou dos 2000 caracteres. **Output:** https://sourceb.in/${bin.key}`);
                }else {
                    msg = await message.channel.createMessage(':warning: O output passou dos 2000 caracteres. Aqui vai o ficheiro com o output!', {
                        name: 'shell.txt',
                        file: Buffer.from(res)
                    });
                }
            }
            if (message.channel.type === 0 && !message.channel.permissionsOf(this.client.user.id).has('addReactions')) return;

            msg.addReaction('x_:751062867444498432');
            msg.addReaction('📋');

            const filter = (_m: Message, emoji: Emoji, member: Member) => (emoji.id === '751062867444498432' || emoji.name === '📋') && member === message.member;

            const collector = new ReactionCollector(this.client, msg, filter, { time: 3 * 60 * 1000, max: 1 });
                
            collector.on('collect', async (m, emoji) => {
                switch(emoji.name) {
                    case '📋':
                        const dmChannel = await message.author.getDMChannel();
                        dmChannel.createMessage(m.content);

                        if (message.channel.type === 0 && message.channel.permissionsOf(this.client.user.id).has('manageMessages'))
                            m.removeReactions();
                        else {
                            m.removeReaction('x_:751062867444498432');
                            m.removeReaction('📋');
                        }  
        
                        m.edit('<a:verificado:803678585008816198> Resultado do shell enviado no privado!');

                        break;
                    case 'x_':
                        if (m.attachments.length === 1) {
                            m.delete();
                            return;
                        }
        
                        if (message.channel.type === 0 && message.channel.permissionsOf(this.client.user.id).has('manageMessages'))
                            m.removeReactions();
                        else {
                            m.removeReaction('x_:751062867444498432');
                            m.removeReaction('📋');
                        }  
        
                        m.edit('<a:verificado:803678585008816198> Resultado da shell fechado!');
                        break;
                }
            });

            collector.on('end', (_c, reason) => {
                if (reason === 'time')
                    msg.removeReaction('x_:751062867444498432');
                    msg.removeReaction('📋');
            });
        })
    }
}

module.exports = Shell;