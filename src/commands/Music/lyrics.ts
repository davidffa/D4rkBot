import Command from '../../structures/Command';
import Client from '../../structures/Client';

import { Message, Emoji, Member } from 'eris';
import { ReactionCollector } from 'eris-collector';

import fetch from 'node-fetch';
import cio from 'cheerio';

interface LyricsRes {
    lyrics: string[];
    albumArt: string;
    url: string;
}

export default class Lyrics extends Command {
    constructor(client: Client) {
        super(client, {
            name: 'lyrics',
            description: 'Mostra a letra de uma música.',
            category: 'Music',
            aliases: ['letra'],
            cooldown: 6,
            usage: '[Nome da música] - [Artista]',
        });
    }

    async execute(message: Message, args: Array<string>): Promise<void> {
        if (message.channel.type !== 0) return;

        if (message.channel.type === 0 && !message.channel.permissionsOf(this.client.user.id).has('embedLinks')) {
            message.channel.createMessage(':x: Preciso da permissão `Anexar Links` para executar este comando');
            return;
        }

        if (message.channel.type === 0 && !message.channel.permissionsOf(this.client.user.id).has('addReactions')) {
            message.channel.createMessage(':x: Preciso da permissão `Adicionar Reações` para executar este comando');
            return;
        }

        const lyrics = async (name: string, artist?: string): Promise<LyricsRes|null> => {
            const song = `${name} ${artist}`
                .toLowerCase()
                .replace(/ *\([^)]*\) */g, '')
                .replace(/ *\[[^\]]*]/, '')
                .replace(/feat.|ft./g, '')
                .replace(/\s+/g, ' ')
                .trim();

            const res = await fetch(`https://api.genius.com/search?q=${encodeURIComponent(song)}`, {
                headers: {
                    Authorization: `Bearer ${process.env.GENIUSLYRICSTOKEN}`
                }
            }).then(res => res.json());

            if (!res.response.hits.length) return null;

            const data = res.response.hits[0].result;

            const lyricsData = await fetch(data.url).then(res => res.text());

            const $ = cio.load(lyricsData);
            let lyrics = $('div[class="lyrics"]').text().trim();

            if (!lyrics) {
                lyrics = '';
                $('div[class^="Lyrics__Container"]').each((i, el) => {
                    if ($(el).text().length) {
                        let snippet = $(el).html()
                            ?.replace(/<br>/g, '\n')
                            .replace(/<(?!\s*br\s*\/?)[^>]+>/gi, '');

                        lyrics += $('<textarea/>').html(snippet || '').text().trim() + '\n\n';
                    }
                })
            }
            
            return { 
                lyrics: lyrics.trim().split('\n') || '',
                albumArt: data.song_art_image_url,
                url: data.url
            };
        }

        let res: LyricsRes|null;

        if (!args.length) {
            const player = this.client.music.players.get(message.guildID as string);

            if (!player || !player.queue.current) {
                message.channel.createMessage(`:x: Não estou a tocar nenhuma música de momento!\nTambém podes usar \`${this.client.guildCache.get(message.guildID as string)?.prefix || 'db.'}lyrics [Nome da música] - [Artista]\` para procurar uma letra de música.`);
                return;
            }

            const [ artist, title ] = player.queue.current.title.split('-');

            if (title) {
                res = await lyrics(title, artist);
            }else {
                res = await lyrics(player.queue.current.title);
            }
        }else {
            const data = args.join(' ').split('-');

            if (data.length === 1)
                res = await lyrics(data[0].trim());
            else
                res = await lyrics(data[0].trim(), data[1].trim());
        }

        if (!res) {
            message.channel.createMessage(':x: Não encontrei nenhum resultado.');
            return;
        }

        let page = 1;
        const pages = Math.ceil(res.lyrics.length / 20);

        const embed = new this.client.embed()
            .setColor('RANDOM')
            .setTitle(args.join(' '))
            .setDescription(res.lyrics.slice(0, 20).join('\n'))
            .setThumbnail(res.albumArt)
            .setURL(res.url)
            .setTimestamp()
            .setFooter(`Página ${page} de ${pages}`, message.author.dynamicAvatarURL());

        const msg = await message.channel.createMessage({ embed });
        msg.addReaction('⬅️');
        msg.addReaction('➡️');

        
        const filter = (_m: Message, emoji: Emoji, member: Member) => (emoji.name === '⬅️' || emoji.name === '➡️') && member === message.member;

        const collector = new ReactionCollector(this.client, msg, filter, { time: 10 * 60 * 1000 });

        collector.on('collect', (m, emoji) => {
            if (!res || message.channel.type !== 0) return;

            if (message.channel.permissionsOf(this.client.user.id).has('manageMessages')) {
                m.removeReaction(emoji.name, message.author.id);
            }
            
            switch (emoji.name) {
                case '⬅️':
                    if (page === 1) return;
                    page--;
                    break;
                case '➡️':
                    if (page === pages) return;
                    page++;
                    break;
            }

            embed.setDescription(res.lyrics.slice((page - 1) * 20, page * 20).join('\n'))
                .setFooter(`Página ${page} de ${pages}`, message.author.dynamicAvatarURL());

            m.edit({ embed });
        })
    }
}