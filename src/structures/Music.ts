import Client from '../structures/Client';
import CommandContext from '../structures/CommandContext';

import { User, Member } from 'eris';
import { Player, Node } from 'erela.js';
import { Manager, NodeOptions } from 'erela.js';
import Spotify from 'erela.js-spotify';

import fetch from 'node-fetch';
import { Parser } from 'xml2js';

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

    this.on('nodeConnect', async (node): Promise<void> => {
      console.log(`${node.options.identifier} (ws${node.options.secure ? 's' : ''}://${node.options.host}:${node.options.port}) conectado!`);

      for (const player of this.players.values()) {
        const position = player.position;
        player.connect();
        player.seek(position);
        player.play();
        player.reconnect = true;
      }
    });

    this.pingNodes();

    this.on('nodeReconnect', (node): void => {
      console.log(`A reconectar ao node ${node.options.identifier} (ws${node.options.secure ? 's' : ''}://${node.options.host}:${node.options.port})...`);
    });

    this.on('nodeError', (node, error): void => {
      console.log(`Ocorreu um erro no Node ${node.options.identifier}. Erro: ${error.message}`);
      if (error.message.startsWith('Unable to connect after')) this.reconnect(node);
    });

    this.on('nodeDisconnect', (node, reason): void => {
      console.log(`O node do lavalink ${node.options.identifier} desconectou inesperadamente.\nMotivo: ${reason.reason ? reason.reason : reason.code ? reason.code : 'Desconhecido'}`);
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

      if (!player.radio) {
        embed.setTitle('<a:disco:803678643661832233> A Tocar')
          .addField(":page_with_curl: Nome:", '`' + track.title + '`')
          .addField(":robot: Enviado por:", '`' + track.author + '`')
          .addField(":watch: Duração:", '`' + this.client.utils.msToHour(track.duration) + '`')
          .setURL(track.uri)
          .setThumbnail(track.displayThumbnail('maxresdefault'))
        player.lastPlayingMsgID = await channel.createMessage({ embed }).then(m => m.id);
      }
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
        const newNode = this.nodes.find(node => node.connected && node !== player.node);

        if (newNode) player.moveNode(newNode);
        else {
          this.client.createMessage(player.textChannel as string, ':warning: Parece que o YouTube me impediu de tocar essa música!\nAguarda um momento enquanto resolvo esse problema e tenta novamente daqui a uns segundos.');
          player.destroy();
        }

        const appName = player.node.options.host.split('.')[0];

        if (appName) {
          await fetch(`https://api.heroku.com/apps/${appName}/dynos`, {
            method: 'DELETE',
            headers: {
              'Accept': 'application/vnd.heroku+json; version=3',
              'Authorization': `Bearer ${process.env.HEROKUAPITOKEN}`
            }
          }); // .then(r => r.status);

          /*
          if (status === 202) {
            this.client.createMessage(player.textChannel, ':warning: Parece que o YouTube me impediu de tocar essa música!\nAguarda um momento enquanto resolvo esse problema e tenta novamente daqui a uns segundos.');
          } else {
            this.client.createMessage(player.textChannel, ':x: Parece que o YouTube me impediu de tocar essa música!\nDesta vez não consegui resolver o problema :cry:.');
          }
          player.destroy();
          */
        }
        return;
      }
      player.textChannel && this.client.createMessage(player.textChannel, `:x: Ocorreu um erro ao tocar a música ${track.title}. Erro: \`${payload.error || 'Desconhecido'}\``);
      console.error(`[Lavalink] Track Error on guild ${player.guild}. Error: ${payload.error}`);

      if (!player.errorCount) {
        player.errorCount = 0;
      } else ++player.errorCount;

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

  canPlay(ctx: CommandContext, player?: Player | undefined): boolean {
    const voiceChannelID = ctx.msg.member?.voiceState.channelID;

    if (!voiceChannelID) {
      ctx.sendMessage(':x: Precisas de estar num canal de voz para executar esse comando!');
      return false;
    }

    const voiceChannel = this.client.getChannel(voiceChannelID);

    if (voiceChannel.type !== 2) {
      ctx.sendMessage(':x: Ocorreu um erro! `Channel type is not VoiceChannel`');
      return false;
    }

    const permissions = voiceChannel.permissionsOf(this.client.user.id);

    if (!permissions.has('readMessages')) {
      ctx.sendMessage(':x: Não tenho permissão para ver o teu canal de voz!');
      return false;
    }

    if (!permissions.has('voiceConnect')) {
      ctx.sendMessage(':x: Não tenho permissão para entrar no teu canal de voz!');
      return false;
    }

    if (!permissions.has('voiceSpeak')) {
      ctx.sendMessage(':x: Não tenho permissão para falar no teu canal de voz!');
      return false;
    }

    if (this.client.records.has(ctx.guild?.id as string)) {
      ctx.sendMessage(':x: Não consigo tocar música enquanto gravo voz!')
      return false;
    }

    if (player && voiceChannelID !== player.voiceChannel) {
      ctx.sendMessage(':x: Precisas de estar no meu canal de voz para usar este comando!');
      return false;
    }

    if (player && !player.radio && player.queue.duration > 8.64e7) {
      ctx.sendMessage(':x: A queue tem a duração superior a 24 horas!')
      return false;
    }
    return true;
  }

  async getRadioNowPlaying(radio: string) {
    let artist, songTitle;
    const xmlParser = new Parser();

    if (['CidadeHipHop', 'CidadeFM', 'RadioComercial', 'M80'].includes(radio)) {
      const xml = await fetch(`https://${radio === 'M80' ? 'm80' : radio === 'RadioComercial' ? 'radiocomercial' : 'cidade'}.iol.pt/nowplaying${radio === 'CidadeHipHop' ? '_Cidade_HipHop' : ''}.xml`).then(r => r.text());

      const text = await xmlParser.parseStringPromise(xml).then(t => t.RadioInfo.Table[0]);

      artist = text['DB_DALET_ARTIST_NAME'][0];
      songTitle = text['DB_DALET_TITLE_NAME'][0];
    } else if (radio === 'RFM') {
      const xml = await fetch('https://configsa01.blob.core.windows.net/rfm/rfmOnAir.xml').then(r => r.buffer()).then(buffer => buffer.toString('utf16le'));

      const text = await xmlParser.parseStringPromise(xml).then(parsed => parsed.music.song[0]);

      artist = text.artist[0];
      songTitle = text.name[0];
    }

    return { artist, songTitle };
  }

  init() {
    return super.init(this.client.user.id);
  }

  private pingNodes() {
    for (const node of this.nodes.values()) {
      if (node.options.host.includes('heroku')) {
        setInterval(() => {
          fetch(`http://${node.options.host}/version`, {
            headers: {
              Authorization: node.options.password!
            }
          })
        }, 15 * 60 * 60 * 1000);
      }
    }
  }

  private reconnect(node: Node) {
    this.destroyNode(node.options.identifier as string);

    const newNode = new Node({
      identifier: node.options.identifier as string,
      host: node.options.host,
      port: node.options.port,
      password: node.options.password,
      retryAmount: 10,
      retryDelay: 3000,
      secure: false,
      region: node.options.region
    })

    this.nodes.set(node.options.identifier as string, newNode);

    newNode.connect();
  }
}