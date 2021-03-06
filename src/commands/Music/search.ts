import Command from '../../structures/Command';
import Client from '../../structures/Client';

import { Message } from 'eris';
import { MessageCollector } from 'eris-collector';

import { Player } from 'erela.js';

export default class Search extends Command {
    constructor(client: Client) {
        super(client, {
            name: 'search',
            description: 'Procura uma música no YouTube e toca-a.',
            category: 'Music',
            aliases: ['procurar', 'searchmusic'],
            cooldown: 5,
            usage: '<Nome>',
            args: 1
        });
    }

    async execute(message: Message, args: Array<string>): Promise<void> {
        if (message.channel.type !== 0) return;
        if (!message.channel.permissionsOf(this.client.user.id).has('embedLinks')) {
            message.channel.createMessage(':x: Preciso da permissão `EMBED_LINKS` para executar este comando');
            return;
        }

        const voiceChannelID = message.member?.voiceState.channelID;
        const currPlayer = this.client.music.players.get(message.guildID as string);
        
        if (!voiceChannelID) {
            message.channel.createMessage(':x: Precisas de estar num canal de voz para executar esse comando!');
            return;
        }

        const voiceChannel = this.client.getChannel(voiceChannelID);
        
        if (voiceChannel.type !== 2) return;

        if (this.client.music.players.get(message.guildID as string) && voiceChannelID !== this.client.music.players.get(message.guildID as string)?.voiceChannel) {
            message.channel.createMessage(':x: Precisas de estar no meu canal de voz para usar este comando!');
            return;
        }

        const permissions = voiceChannel.permissionsOf(this.client.user.id);
        
        if (!permissions.has('readMessages')) {
            message.channel.createMessage(':x: Não tenho permissão para ver o teu canal de voz!');
            return;
        }

        if (!permissions.has('voiceConnect')) {
            message.channel.createMessage(':x: Não tenho permissão para entrar no teu canal de voz!');
            return;
        }

        if (!permissions.has('voiceSpeak')) {
            message.channel.createMessage(':x: Não tenho permissão para falar no teu canal de voz!');
            return;
        }

        if (this.client.records.has(message.guildID as string)) {
            message.channel.createMessage(':x: Não consigo tocar música enquanto gravo voz!')
            return;
        }

        if (currPlayer && currPlayer.queue.duration > 8.64e7) {
            message.channel.createMessage(':x: A queue tem a duração superior a 24 horas!')
            return;
        }

        const createPlayer = (): Player => {
            return this.client.music.create({
                guild: message.guildID as string,
                voiceChannel: voiceChannelID,
                textChannel: message.channel.id,
                selfDeafen: true
            })
        }

        try {
            const res = await this.client.music.search(args.join(' '), message.author);

            if (res.loadType === 'SEARCH_RESULT') {
                const resLength = res.tracks.length >= 10 ? 10 : res.tracks.length;
                let desc = '';

                for (let i=1; i<= resLength; i++) {
                    desc += `${i}º - \`${res.tracks[i-1].title}\`\n`;
                }

                desc += `Envie mensagem com o número da música, (0 para cancelar)`;

                const embed = new this.client.embed()
                    .setColor('RANDOM')
                    .setTitle(':bookmark_tabs: Resultados da procura')
                    .setDescription(desc)
                    .setAuthor(`${message.author.username}#${message.author.discriminator}`, message.author.dynamicAvatarURL())
                    .setTimestamp();

                const msg = await message.channel.createMessage({ embed });

                const searchCollector = this.client.music.searchMsgCollectors.get(message.author.id);

                if (searchCollector) {
                    searchCollector.message.edit({ content: ':x: Pesquisa cancelada!', embed: {} });
                    searchCollector.messageCollector.stop('New Search');
                    this.client.music.searchMsgCollectors.delete(message.author.id);
                }

                const filter = (m: Message) => m.author.id === message.author.id && parseInt(m.content) >= 0 && parseInt(m.content) <= resLength;
                const collector = new MessageCollector(this.client, message.channel, filter, { max: 1, time: 20000 });

                this.client.music.searchMsgCollectors.set(message.author.id, { message: msg, messageCollector: collector });

                collector.on('collect', m => {
                    msg.delete().catch(() => {});

                    const idx = parseInt(m.content);

                    if (idx === 0) {
                        message.channel.createMessage(':x: Pesquisa cancelada!');
                        return;
                    }

                    const player = currPlayer || createPlayer();

                    if (player.state === 'DISCONNECTED') {
                        if (!voiceChannel.permissionsOf(this.client.user.id).has('manageChannels') && voiceChannel.userLimit && voiceChannel.voiceMembers.size >= voiceChannel.userLimit) {
                            message.channel.createMessage(':x: O canal de voz está cheio!');
                            player.destroy();
                            return;
                        }
                        player.connect();
                    }

                    player.queue.add(res.tracks[idx-1]);

                    if (!player.playing) 
                        player.play()
                    else
                        message.channel.createMessage(`:bookmark_tabs: Adicionado à lista \`${res.tracks[idx-1].title}\``);
                });

                collector.on('end', (_c, reason) => {
                    this.client.music.searchMsgCollectors.delete(message.author.id);
                    if (reason === 'time')
                        msg.edit({ content: ':x: Pesquisa cancelada!', embed: {} });
                });
            }else {
                message.channel.createMessage(':x: Não encontrei nenhum resultado!');
            }
        }catch (err) {
            console.error(err);
            message.channel.createMessage(':x: Ocorreu um erro ao procurar a música.');
        }
    }
}