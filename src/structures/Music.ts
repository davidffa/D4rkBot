import { Manager, NodeOptions } from 'erela.js';
import Spotify from 'erela.js-spotify';
import Client from '../structures/Client';

import { User, Member } from 'eris';

import { Timeouts, MsgCollectors } from '../typings/index';

export default class D4rkManager extends Manager {
    client: Client;
    channelTimeouts: Map<string, Timeouts>;
    searchMsgCollectors: Map<string, MsgCollectors>;

    constructor(client: Client, nodes: NodeOptions[]) {
        super({
            nodes,
            autoPlay: true,
            send(id, payload) {
                const guild = client.guilds.get(id);
                if (guild) guild.shard.sendWS(payload.op, payload.d);
            },
            plugins: [
                new Spotify({
                    clientID: process.env.SPOTIFYCLIENTID as string,
                    clientSecret: process.env.SPOTIFYCLIENTSECRET as string
                })
            ],
        });
        
        this.client = client;
        this.channelTimeouts = new Map();
        this.searchMsgCollectors = new Map();

        const loadTestServerMusic = async (): Promise<void> => {
            const player = this.create({
                guild: process.env.TESTGUILDID as string,
                voiceChannel: process.env.VOICECHANNELID as string,
                textChannel: process.env.TEXTCHANNELID as string,
                selfDeafen: true,
                selfMute: true
            });

            player.connect();
            
            const { tracks } = await this.search('https://www.youtube.com/watch?v=KMU0tzLwhbE', this.client.user);

            player.queue.add(tracks[0]);

            if (!player.playing) player.play();
        }

        this.on('nodeConnect', async (node): Promise<void> => {
            console.log(`${node.options.identifier} do LavaLink com o IP ${node.options.host}:${node.options.port} conectado!`);

            //Heroku lavalink
            loadTestServerMusic();
        });
        
        this.on('nodeReconnect', (node): void => {
            console.log(`${node.options.identifier} do LavaLink com o IP ${node.options.host}:${node.options.port} re-conectado!`);
        });

        this.on('nodeError', (node, error): void => {
            console.log(`Ocorreu um erro no Node ${node.options.identifier}. Erro: ${error.message}`);
        });

        this.on('nodeDisconnect', (node, reason): void => {
            console.log(`O node do lavalink ${node.options.identifier} desconectou inesperadamente.\nMOTIVO: ${reason.reason}`);
        });

        this.on('trackStart', async (player, track): Promise<void> => {
            /*** Heroku lavalink ***/
            if (player.guild === process.env.TESTGUILDID) {
                setTimeout(() => {
                    player.pause(true);
                }, 3000);
                return;
            }
            /*** End ***/

            if (!player.textChannel) return;

            const channel = this.client.getChannel(player.textChannel);
            if (channel.type !== 0) return;

            if (player.lastPlayingMsgID) {
                const msg = channel.messages.get(player.lastPlayingMsgID);

                if (msg) msg.delete();
            }
            
            const requester = player.queue.current?.requester as User;

            const embed = new this.client.embed()
                .setColor('RANDOM')
                .setTitle('<a:disco:803678643661832233> A Tocar')
                .addField(":page_with_curl: Nome:", '`' + track.title + '`')
                .addField(":robot: Enviado por:", '`' + track.author + '`')
                .addField(":watch: Duração:", '`' + this.client.utils.msToHour(track.duration) + '`')
                .setURL(track.uri)
                .setThumbnail(track.displayThumbnail('maxresdefault'))
                .setTimestamp()
                .setFooter(`${requester.username}#${requester.discriminator}`, requester.dynamicAvatarURL());
        
            player.lastPlayingMsgID = await channel.createMessage({ embed }).then(m => m.id);
        });

        this.on('trackStuck', (player, track): void => {
            if (player.textChannel) {
                this.client.createMessage(player.textChannel, `:x: Ocorreu um erro ao tocar a música ${track.title}.`);
                this.destroy(player.guild);
            }
            console.error(`[Lavalink] Track Stuck on guild ${player.guild}. Music title: ${track.title}`);
        });

        this.on('trackError', (player, track, payload): void => {
            if (player.textChannel) {
                if (payload.error === 'Track information is unavailable.') 
                    this.client.createMessage(player.textChannel, `:x: Não consegui tocar a música ${track.title} devido à mesma ter restrição de idade`)
                else 
                    this.client.createMessage(player.textChannel, `:x: Ocorreu um erro ao tocar a música ${track.title}. Erro: \`${payload.error}\``)
            }
            console.error(`[Lavalink] Track Error on guild ${player.guild}. Error: ${payload.error}`);

            /*** Heroku lavalink ***/
            if (player.guild === process.env.TESTGUILDID) {
                this.destroy(player.guild);

                setTimeout(() => {
                    loadTestServerMusic();
                }, 5000);
                return;
            }
            /*** End ***/
            this.destroy(player.guild);
        });

        this.on('queueEnd', (player): void => {
            if (player.textChannel) {
                const channel = this.client.getChannel(player.textChannel);
                if (channel.type !== 0) return;

                if (player.lastPlayingMsgID) {
                    const msg = channel.messages.get(player.lastPlayingMsgID);
                    if (msg) msg.delete();
                }
                player.destroy();

                channel.createMessage(`:bookmark_tabs: A lista de músicas acabou!`);
            }
        });
    }

    async hasDJRole(member: Member): Promise<boolean> {
        const guildData = member.guild.dbCache;
        
        if (guildData && guildData.djRole) {
            const djRoleID = guildData.djRole;
            const djRole = member.guild.roles.get(djRoleID);

            if (!djRole) {
                guildData.djRole = '';
                const guildDBData = await this.client.guildDB.findOne({ guildID: member.guild.id });

                if (guildDBData) {
                    guildDBData.djrole = '';
                    guildDBData.save();
                }
                return false;
            }

            if (member?.roles.find(r => r === djRoleID)) {
                return true;
            }else {
                return false;
            }
        }
        
        return false;
    }

    init() {
        return super.init(this.client.user.id);
    }
}