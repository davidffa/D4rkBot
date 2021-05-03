import { Manager, NodeOptions } from 'erela.js';
import Spotify from 'erela.js-spotify';
import Client from '../structures/Client';

import { User, Member, Message } from 'eris';
import { Player, Node } from 'erela.js';
import fetch from 'node-fetch';

import { Timeouts, MsgCollectors } from '../typings/index';

interface HeartBeats {
  lastheartbeatSent: number;
  lastheartbeatAck: number;
  heartbeatInterval: ReturnType<typeof setInterval>;
  ping: number;
}

export default class D4rkManager extends Manager {
  client: Client;
  channelTimeouts: Map<string, Timeouts>;
  searchMsgCollectors: Map<string, MsgCollectors>;
  heartbeats: Map<string, HeartBeats>;

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
    this.heartbeats = new Map();

    this.on('nodeConnect', async (node): Promise<void> => {
      console.log(`${node.options.identifier} do Lavalink (ws${node.options.secure ? 's' : ''}://${node.options.host}:${node.options.port}) conectado!`);

      for (const player of this.players.values()) {
        const position = player.position;
        player.connect();
        player.seek(position);
        player.play();
        player.reconnect = true;
      }

      //Send an heartbeat to lavalink to prevent error H15 (WebSocket idle) on heroku

      this.heartbeats.set(node.options.identifier as string, {} as HeartBeats);
      const heartbeats = this.heartbeats.get(node.options.identifier as string);
      if (!heartbeats) return;

      node.send({ 
        op: 'heartbeat'
      });
      heartbeats.lastheartbeatSent = Date.now();

      heartbeats.heartbeatInterval = setInterval(() => {
        if (heartbeats.lastheartbeatSent > heartbeats.lastheartbeatAck) {
          clearInterval(heartbeats.heartbeatInterval);
          return;
        }
        node.send({ 
          op: 'heartbeat'
        });
        heartbeats.lastheartbeatSent = Date.now();
      }, 45000);

      /*** END ***/
    });

    this.on('nodeReconnect', (node): void => {
      console.log(`A reconectar ao node ${node.options.identifier} (ws${node.options.secure ? 's' : ''}://${node.options.host}:${node.options.port})...`);
    });

    this.on('nodeError', (node, error): void => {
      /*** Receive the heartbeat acknowledge ***/
      if (error && error.message.includes('Unexpected op "heartbeatAck"')) {
        const data = this.heartbeats.get('Node 1');
        if (data) {
          data.lastheartbeatAck = Date.now();
          data.ping = data.lastheartbeatAck - data.lastheartbeatSent;
        }
        return;
      }
      /*** END ***/
      console.log(`Ocorreu um erro no Node ${node.options.identifier}. Erro: ${error.message}`);
      if (error.message.startsWith('Unable to connect after')) this.reconnect();
    });

    this.on('nodeDisconnect', (node, reason): void => {
      console.log(`O node do lavalink ${node.options.identifier} desconectou inesperadamente.\nMotivo: ${reason.reason ? reason.reason : reason.code ? reason.code : 'Desconhecido'}`);

      const data = this.heartbeats.get(node.options.identifier as string);

      if (data) {
        clearInterval(data.heartbeatInterval);
        this.heartbeats.delete(node.options.identifier as string);
      }
    });

    this.on('trackStart', async (player, track): Promise<void> => {
      if (player.reconnect) {
        delete player.reconnect;
        return;
      }

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
        .setTimestamp()
        .setFooter(`${requester.username}#${requester.discriminator}`, requester.dynamicAvatarURL());

      if (player.radio) {
        embed.setTitle(`<a:disco:803678643661832233> A Tocar a rádio ${player.radio}`)
      } else {
        embed.setTitle('<a:disco:803678643661832233> A Tocar')
          .addField(":page_with_curl: Nome:", '`' + track.title + '`')
          .addField(":robot: Enviado por:", '`' + track.author + '`')
          .addField(":watch: Duração:", '`' + this.client.utils.msToHour(track.duration) + '`')
          .setURL(track.uri)
          .setThumbnail(track.displayThumbnail('maxresdefault'))
      }

      player.lastPlayingMsgID = await channel.createMessage({ embed }).then(m => m.id);
    });

    this.on('trackStuck', (player, track): void => {
      if (player.textChannel) {
        this.client.createMessage(player.textChannel, `:x: Ocorreu um erro ao tocar a música ${track.title}.`);
        player.stop();
      }
      console.error(`[Lavalink] Track Stuck on guild ${player.guild}. Music title: ${track.title}`);
    });

    this.on('trackError', async (player, track, payload): Promise<void> => {
      if (payload.error && payload.error.includes('429')) {
        if (player.textChannel) {
          const appName = process.env.LAVALINKHOST?.split('.')[0];

          if (appName && !Number(appName)) {
            const status = await fetch(`https://api.heroku.com/apps/${appName}/dynos`, {
              method: 'DELETE',
              headers: {
                'Accept': 'application/vnd.heroku+json; version=3',
                'Authorization': `Bearer ${process.env.HEROKUAPITOKEN}`
              }
            }).then(r => r.status);
  
            if (status === 202) {
              this.client.createMessage(player.textChannel, ':warning: Parece que o YouTube me impediu de tocar essa música!\nAguarda um momento enquanto resolvo esse problema e tenta novamente daqui a uns segundos.');
            }else {
              this.client.createMessage(player.textChannel, ':x: Parece que o YouTube me impediu de tocar essa música!\nDesta vez não consegui resolver o problema :cry:.');
            }
            return;
          }
        }
      }
      player.textChannel && this.client.createMessage(player.textChannel, `:x: Ocorreu um erro ao tocar a música ${track.title}. Erro: \`${payload.error || 'Desconhecido'}\``);
      console.error(`[Lavalink] Track Error on guild ${player.guild}. Error: ${payload.error}`);

      if (!player.errorCount) {
        player.errorCount = 0;
      }else ++player.errorCount;

      if (player.errorCount > 5) {
        player.destroy();
        return;
      }
      
      player.stop();
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

    this.on('playerDestroy', (player) => {
      if (player.djTableMsg) {
        player.djTableMsg.delete();
      }
    });
  }

  async hasDJRole(member: Member): Promise<boolean> {
    const guildData = this.client.guildCache.get(member.guild.id);

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
      } else {
        return false;
      }
    }
    return false;
  }

  canPlay(message: Message, player?: Player | undefined): boolean {
    const voiceChannelID = message.member?.voiceState.channelID;

    if (!voiceChannelID) {
      message.channel.createMessage(':x: Precisas de estar num canal de voz para executar esse comando!');
      return false;
    }

    const voiceChannel = this.client.getChannel(voiceChannelID);

    if (voiceChannel.type !== 2) {
      message.channel.createMessage(':x: Ocorreu um erro! `Channel type is not VoiceChannel`');
      return false;
    }

    const permissions = voiceChannel.permissionsOf(this.client.user.id);

    if (!permissions.has('readMessages')) {
      message.channel.createMessage(':x: Não tenho permissão para ver o teu canal de voz!');
      return false;
    }

    if (!permissions.has('voiceConnect')) {
      message.channel.createMessage(':x: Não tenho permissão para entrar no teu canal de voz!');
      return false;
    }

    if (!permissions.has('voiceSpeak')) {
      message.channel.createMessage(':x: Não tenho permissão para falar no teu canal de voz!');
      return false;
    }

    if (this.client.records.has(message.guildID as string)) {
      message.channel.createMessage(':x: Não consigo tocar música enquanto gravo voz!')
      return false;
    }

    if (player && voiceChannelID !== player.voiceChannel) {
      message.channel.createMessage(':x: Precisas de estar no meu canal de voz para usar este comando!');
      return false;
    }

    if (player && !player.radio && player.queue.duration > 8.64e7) {
      message.channel.createMessage(':x: A queue tem a duração superior a 24 horas!')
      return false;
    }
    return true;
  }

  init() {
    return super.init(this.client.user.id);
  }

  reconnect() {
    this.destroyNode('Node 1');

    this.nodes.set('Node 1',
      new Node({
        identifier: 'Node 1',
        host: process.env.LAVALINKHOST as string,
        port: Number(process.env.LAVALINKPORT),
        password: process.env.LAVALINKPASSWORD as string,
        retryAmount: 10,
        retryDelay: 3000,
        secure: false
      })
    );

    this.nodes.first()?.connect();
  }
}