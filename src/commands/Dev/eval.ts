import Command from '../../structures/Command';
import Client from '../../structures/Client';

import { Message, Member, Emoji } from 'eris';
import { ReactionCollector } from 'eris-collector';

import { Player } from 'erela.js';

import { inspect } from 'util';
import { Type } from '@anishshobith/deeptype';

import { GuildCache } from '../../typings';

import fetch from 'node-fetch';

class Eval extends Command {
    player: Player|null|undefined;
    guildCache: GuildCache|null|undefined;
    fetch: typeof fetch;

    constructor(client: Client) {
        super(client, {
            name: 'eval',
            description: 'Executa um código JavaScript e retorna o seu resultado',
            aliases: ['e', 'ev', 'evl', 'evaluate'],
            usage: '<código>',
            category: 'Dev',
            args: 1,
            dm: true
        });

        this.fetch = fetch;
    }
    
    async execute(message: Message, args: Array<string>): Promise<void> {
        if (message.author.id !== '334054158879686657') return;
        
        if (message.guildID) {
            this.player = this.client.music.get(message.guildID);
            this.guildCache = this.client.guildCache.get(message.guildID);
        }else { 
            this.player = null
            this.guildCache = null;
        }

        const clean = (text: any): any => {
            if (typeof text === 'string') {
                text = text
                    .replace(/`/g, `\`${String.fromCharCode(8203)}`)
                    .replace(/@/g, `@${String.fromCharCode(8203)}`)
                    .replace(new RegExp(this.client.token as string, 'gi'), '****');
            }
            return text;
        }

        try {
            const start = process.hrtime();
            const code = args.join(' ');
            let evaled = eval(code);

            if (evaled instanceof Promise)
                evaled = await evaled;

            const stop = process.hrtime(start);
            const response = [
                `:outbox_tray: **Output** \`\`\`js\n${clean(inspect(evaled, { depth: 0 }))}\n\`\`\``,
                `<:lang_js:803678540528615424> **Tipo** \`\`\`js\n${new Type(evaled).is}\n\`\`\``,
                `:timer: **Tempo** \`\`\`${((stop[0] * 1e9) + stop[1]) / 1e6}ms \`\`\``
            ];
            
            const res = response.join('\n');

            let msg: Message;

            if (res.length < 2e3) {
                msg = await message.channel.createMessage(res);
            }else {
                const body = {
                    files: [{
                        name: 'Eval output result',
                        content: `//Output:\n${clean(inspect(evaled, { depth: 0 }))}\n//Tipo:\n${new Type(evaled).is}\n//Tempo:\n${((stop[0] * 1e9) + stop[1]) / 1e6}ms`,
                        languageId: 183
                    }]
                }

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
                        name: 'eval.txt',
                        file: Buffer.from(res)
                    });
                }
            }

            if (message.channel.type === 0 && !message.channel.permissionsOf(this.client.user.id).has('addReactions')) return;

            msg.addReaction('x_:751062867444498432');
            msg.addReaction('📋');

            const filter = (_m: Message, emoji: Emoji, member: Member) => (emoji.id === '751062867444498432' || emoji.name === '📋') && member === message.member;

            const collector = new ReactionCollector(this.client, msg, filter, { time: 3 * 60 * 1000 });
                
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
        
                        m.edit('<a:verificado:803678585008816198> Resultado da eval enviado no privado!');

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
        
                        m.edit('<a:verificado:803678585008816198> Resultado da eval fechado!');
                        break;
                }
            });

            collector.on('end', (_c, reason) => {
                if (reason === 'time')
                    msg.removeReaction('x_:751062867444498432');
                    msg.removeReaction('📋');
            });
        }catch (err) {
            message.channel.createMessage(`:x: Erro: \`\`\`x1\n${clean(err)}\`\`\``)
        }
    }
}

module.exports = Eval;