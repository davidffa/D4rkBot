import Command from '../../structures/Command';
import Client from '../../structures/Client';
import { ReactionCollector, MessageCollector } from '../../structures/Collector';

import { Message, User, Emoji as ErisEmoji } from 'eris';

import fetch from 'node-fetch';

import moment from 'moment';
moment.locale('pt');

interface UnicodeEmojiInfo {
    name: string;
    slug: string;
    group: string;
    emoji_version: string;
    unicode_version: string;
    skin_tone_support: boolean;
}

interface GuildEmoji {
    animated: boolean;
    id: string;
    name: string;
}

export default class Emoji extends Command {
    constructor(client: Client) {
        super(client, {
            name: 'emoji',
            description: 'Procura emojis e obtém informação sobre eles',
            usage: '[nome]',
            category: 'Others',
            aliases: ['searchemoji', 'emojis', 'procuraremoji', 'emojiinfo'],
            cooldown: 5
        });
    }

    async execute(message: Message, args: Array<string>): Promise<void> {
        if (message.channel.type !== 0) return;

        if (!message.channel.permissionsOf(this.client.user.id).has('embedLinks')) {
            message.channel.createMessage(':x: Preciso da permissão `Anexar Links` para executar este comando');
            return;
        }

        if (!message.channel.permissionsOf(this.client.user.id).has('addReactions')) {
            message.channel.createMessage(':x: Preciso da permissão `Adicionar Reações` para executar este comando');
            return;
        }

        if (args[0]) {
            const unicodeEmojiInfo: UnicodeEmojiInfo | undefined = require('unicode-emoji-json')[args[0]];

            if (unicodeEmojiInfo) {
                const emojiAPIInfo = await fetch(`https://emoji-api.com/emojis?search=${unicodeEmojiInfo.slug}&access_key=${process.env.EMOJIAPIKEY}`).then(res => res.json());

                const embed = new this.client.embed()
                    .setColor('RANDOM')
                    .setDescription(`Informação do emoji \`${args[0]}\``)
                    .setTitle(':grinning: Emoji Info')
                    .addField(':bookmark_tabs: Nome', `\`${unicodeEmojiInfo.name}\``, true)
                    .addField(':newspaper:  Slug', `\`${unicodeEmojiInfo.slug}\``, true)
                    .addField(':books: Grupo', `\`${unicodeEmojiInfo.group}\``, true)
                    .addField(':link: Versão do emoji', `\`${unicodeEmojiInfo.emoji_version}\``, true)
                    .addField(':pushpin: Versão de unicode', `\`${unicodeEmojiInfo.unicode_version}\``, true)
                    .setTimestamp()
                    .setFooter(`${message.author.username}#${message.author.discriminator}`, message.author.dynamicAvatarURL());

                if (emojiAPIInfo) {
                    const emoji = emojiAPIInfo[0];
                    embed.addField(':book: Sub-grupo', `\`${emoji.subGroup}\``, true)
                        .addField(':id: Código', `\`${emoji.codePoint}\``, true)

                    if (emoji.codePoint.length === 5) {
                        embed.setThumbnail(`https://twemoji.maxcdn.com/v/latest/72x72/${emoji.codePoint.toLowerCase()}.png`)
                            .setURL(`https://twemoji.maxcdn.com/v/latest/72x72/${emoji.codePoint.toLowerCase()}.png`)
                    }
                }

                embed.addField(`:handshake: Suporte para tom de pele`, `\`${unicodeEmojiInfo.skin_tone_support ? 'Sim' : 'Não'}\``, true);

                message.channel.createMessage({ embed });
                return;
            }
        }

        if (!message.channel.guild.emojis.length) {
            message.channel.createMessage(':x: Este servidor não tem emojis :frowning2:.');
            return;
        }

        if (!args.length) {
            const emojiList: Array<string> = [];

            message.channel.guild.emojis.forEach((emoji: GuildEmoji) => {
                emoji.animated ? emojiList.push(`<a:${emoji.name}:${emoji.id}>`) : emojiList.push(`<:${emoji.name}:${emoji.id}>`);
            });

            let page = 1;
            const pages = Math.ceil(emojiList.length / 30);

            const embed = new this.client.embed()
                .setColor('RANDOM')
                .setDescription(`Lista dos emojis do servidor\n\n${emojiList.slice(0, 30).join(' | ')}`)
                .setTimestamp()
                .setFooter(`Página ${page} de ${pages}`, message.author.dynamicAvatarURL());

            const msg = await message.channel.createMessage({ embed });

            if (emojiList.length > 30) {
                msg.addReaction('⬅️');
                msg.addReaction('➡️');

                const filter = (r: ErisEmoji, user: User) => (r.name === '⬅️' || r.name === '➡️') && user === message.author;
                const collector = new ReactionCollector(this.client, msg, filter, { time: 5 * 60 * 1000 });

                collector.on('collect', async r => {
                    if (msg.channel.type !== 0) return;

                    if (msg.channel.permissionsOf(this.client.user.id).has('manageMessages')) {
                        msg.removeReaction(r.name, message.author.id);
                    }

                    switch (r.name) {
                        case '⬅️':
                            if (page === 1) return;
                            page--;
                            break;
                        case '➡️':
                            if (page === pages) return;
                            page++;
                            break;
                    }

                    embed.setDescription(`Lista dos emojis do servidor\n\n${emojiList.slice((page - 1) * 30, page * 30).join(' | ')}`)
                        .setFooter(`Página ${page} de ${pages}`, message.author.dynamicAvatarURL());
                    msg.edit({ embed });
                });
            }
            return;
        }

        const getEmojiInfo = (emoji: GuildEmoji) => {
            const createdAt = Math.floor(Number(emoji.id) / 4194304) + 1420070400000;
            const url = `https://cdn.discordapp.com/emojis/${emoji.id}.${emoji.animated ? 'gif' : 'png'}`;

            const embed = new this.client.embed()
                .setTitle(':grinning: Emoji Info')
                .setColor('RANDOM')
                .addField('Animado:', `\`${emoji.animated ? 'Sim' : 'Não'}\``, true)
                .addField('Adicionado em:', `\`${moment(createdAt).format('L')}\``, true)
                .addField('ID:', `\`${emoji.id}\``, true)
                .addField('Nome:', `\`${emoji.name}\``, true)
                .addField('Identificador:', `\`${emoji.animated ? `<a:${emoji.name}:${emoji.id}>` : `<:${emoji.name}:${emoji.id}>`}\``, true)
                .setURL(url)
                .setThumbnail(url)
                .setTimestamp()
                .setFooter(`${message.author.username}#${message.author.discriminator}`, message.author.dynamicAvatarURL());

            message.channel.createMessage({ embed });
        }

        if (args[0].split(':').length === 3) {
            const e = message.channel.guild.emojis.find((emoji: GuildEmoji) => emoji.id === args[0].split(':')[2].slice(0, -1));

            if (!e) {
                message.channel.createMessage(':x: Não encontrei esse emoji!');
                return;
            }
            getEmojiInfo(e);
            return;
        }

        const emojiList: Array<GuildEmoji> = [];

        message.channel.guild.emojis.forEach((emoji: GuildEmoji) => {
            if (emoji.name.includes(args[0]) || emoji.id === args[0]) {
                emojiList.push(emoji);
            }
        });

        if (!emojiList.length) {
            message.channel.createMessage(':x: Não encontrei esse emoji!');
            return;
        }

        if (emojiList.length === 1) {
            getEmojiInfo(emojiList[0]);
            return;
        }

        const emojiStringList = emojiList.slice(0, 20).map((emoji: GuildEmoji, idx) => {
            return `${idx+1} - <${emoji.animated ? 'a' : ''}:${emoji.name}:${emoji.id}>`;
        });

        const embed = new this.client.embed()
            .setTitle(':grinning: Lista de emojis encontrados')
            .setColor('RANDOM')
            .setDescription(`${emojiStringList.join('\n')}\nEscreve um número de **1** a **${emojiList.length >= 20 ? '20' : emojiList.length}** para obter informação sobre esse emoji`)
            .setTimestamp()
            .setFooter(`${message.author.username}#${message.author.discriminator}`, message.author.dynamicAvatarURL());

        const msg = await message.channel.createMessage({ embed });

        const filter = (m: Message) => m.author.id === message.author.id && parseInt(m.content) >= 1 && parseInt(m.content) <= 20;
        const collector = new MessageCollector(this.client, message.channel, filter, { max: 1, time: 20000 });

        collector.on('collect', m => {
            msg.delete();
            getEmojiInfo(emojiList[Number(m.content) - 1]);
        });
    }
}