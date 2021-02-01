import Command from '../../structures/Command';
import Client from '../../structures/Client';
import Embed from '../../structures/Embed';

import { Emoji, Member, Message, User } from 'eris';
import { ReactionCollector } from 'eris-collector';

class Queue extends Command {
    constructor(client: Client) {
        super(client, {
            name: 'queue',
            description: 'Vê as músicas que estão na queue.',
            category: 'Music',
            aliases: ['q'],
            cooldown: 6,
        });
    }

    async execute(message: Message): Promise<void> {
        if (message.channel.type !== 0) return;
        if (!message.channel.permissionsOf(this.client.user.id).has('embedLinks')) {
            message.channel.createMessage(':x: Preciso da permissão `EMBED_LINKS` para executar este comando');
            return;
        }

        const player = this.client.music.players.get(message.guildID as string);

        if (!player) {
            message.channel.createMessage(':x: Não estou a tocar nada de momento!');
            return;
        }
        
        const queue = player.queue;

        const getSongDetails = (pos: number, pos2: number): string => {
            const data = [];

            for ( ; pos<=pos2 && queue[pos]; pos++) {
                const req = queue[pos].requester as User;
                data.push(`${pos+1}º - \`${queue[pos].title}\` (Requisitado por \`${req.username}#${req.discriminator}\`)`)
            }
            return data.join('\n');
        }

        let page = 1;
        const pages = Math.ceil(queue.size / 10);

        const req = queue.current?.requester as User;

        const embed = new Embed()
            .setColor('RANDOM')
            .setTitle(':bookmark_tabs: Lista de músicas')
            .setDescription(`
                <a:disco:803678643661832233> **A tocar:** \`${queue.current?.title}\` (Requisitado por \`${req.username}#${req.discriminator}\`)\n
                :alarm_clock: Tempo total da queue (${this.client.utils.msToHour(queue.duration)}) ----- Total de músicas na queue: ${queue.size}\n
                ${getSongDetails(0, 9)}
            `)
            .setTimestamp()
            .setFooter(`Página ${page} de ${pages}`, message.author.dynamicAvatarURL());

        const msg = await message.channel.createMessage({ embed });
        
        if (queue.size <= 10) return;

        msg.addReaction('⬅️');
        msg.addReaction('➡️');

        
        const filter = (_m: Message, emoji: Emoji, member: Member) => (emoji.name === '⬅️' || emoji.name === '➡️') && member === message.member;

        const collector = new ReactionCollector(this.client, msg, filter, { time: 10 * 60 * 1000 });

        collector.on('collect', (m, emoji) => {
            if (message.channel.type !== 0) return;
            switch (emoji.name) {
                case '⬅️':
                    if (page === 1) return;
                    page--;
                    if (page === 1) {
                        embed.setDescription(`
                            <a:disco:803678643661832233> **A tocar:** \`${queue.current?.title}\` (Requisitado por \`${req.username}#${req.discriminator}\`)\n
                            :alarm_clock: Tempo total da queue (${this.client.utils.msToHour(queue.duration)}) ----- Total de músicas na queue: ${queue.size}\n
                            ${getSongDetails(0, 9)}
                        `)
                    }else {
                        embed.setDescription(getSongDetails((page - 1) * 9+1, page * 9))
                        .setFooter(`Página ${page} de ${pages}`, message.author.dynamicAvatarURL());
                    }

                    m.edit({ embed });

                    if (message.channel.permissionsOf(this.client.user.id).has('manageMessages')) {
                        m.removeReaction(emoji.name, message.author.id);
                    }
                    break;
                case '➡️':
                    if (page === pages) return;
                    page++;
                    embed.setDescription(getSongDetails((page - 1) * 9+1, page * 9))
                        .setFooter(`Página ${page} de ${pages}`, message.author.dynamicAvatarURL());

                    m.edit({ embed });

                    if (message.channel.permissionsOf(this.client.user.id).has('manageMessages')) {
                        m.removeReaction(emoji.name, message.author.id);
                    }
                    break;
            }
        })
    }
}

module.exports = Queue;