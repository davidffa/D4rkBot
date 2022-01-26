import Client from './Client';
import CommandContext from './CommandContext';

import { User, Member, VoiceChannel } from 'eris';
import { NodeOptions, Vulkava, Player, Node } from 'vulkava';

import { Parser } from 'xml2js';

import { Timeouts, ComponentCollectors } from '../typings/index';

export default class D4rkManager extends Vulkava {
  client: Client;
  channelTimeouts: Map<string, Timeouts>;
  searchCollectors: Map<string, ComponentCollectors>;

  constructor(client: Client, nodes: NodeOptions[]) {
    super({
      nodes,
      sendWS(id, payload) {
        const guild = client.guilds.get(id);
        if (guild) guild.shard.sendWS(payload.op, payload.d);
      },
      /*
      spotify: {
        clientId: process.env.SPOTIFYCLIENTID!,
        clientSecret: process.env.SPOTIFYCLIENTSECRET!,
      }
      */
    });

    this.client = client;
    this.channelTimeouts = new Map();
    this.searchCollectors = new Map();

    this.on('nodeConnect', async (node): Promise<void> => {
      console.log(`${node.identifier} (ws${node.options.secure ? 's' : ''}://${node.options.hostname}:${node.options.port}) conectado!`);

      for (const player of [...this.players.values()].filter(p => p.node === node).values()) {
        const position = player.position;
        player.connect();
        player.play({ startTime: position });
      }
    });

    this.pingNodes();

    this.on('error', (node, error): void => {
      console.log(`Ocorreu um erro no Node ${node.identifier}. Erro: ${error.message}`);
      if (error.message.startsWith('Unable to connect after')) this.reconnect(node);
    });

    this.on('nodeDisconnect', (node, code, reason): void => {
      console.log(`O node do lavalink ${node.identifier} desconectou. Close code: ${code}. Reason: ${reason === '' ? 'Unknown' : reason}`);
    });

    this.on('trackStart', async (player, track): Promise<void> => {
      if (player.reconnect) {
        delete player.reconnect;
        return;
      }

      if (!player.textChannelId) return;

      const channel = this.client.getChannel(player.textChannelId);
      if (channel.type !== 0) return;

      if (player.lastPlayingMsgID) {
        const msg = channel.messages.get(player.lastPlayingMsgID);

        if (msg) msg.delete();
      }

      if (!channel.permissionsOf(this.client.user.id).has('sendMessages')) {
        delete player.lastPlayingMsgID;
        return;
      }

      const requester = player.current?.requester as User;

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
          .setThumbnail(track.thumbnail!)
        player.lastPlayingMsgID = await channel.createMessage({ embeds: [embed] }).then(m => m.id);
      }
    });

    this.on('trackStuck', (player, track): void => {
      if (player.textChannelId) {
        this.client.createMessage(player.textChannelId, `:x: Ocorreu um erro ao tocar a música ${track.title}.`);
        player.skip();
      }
      console.error(`[Lavalink] Track Stuck on guild ${player.guildId}. Music title: ${track.title}`);
    });

    this.on('trackException', async (player, track, err): Promise<void> => {
      if (err && err.message.includes('429')) {
        const newNode = this.nodes.find(node => node.state === 1 && node !== player.node);

        if (newNode) player.moveNode(newNode);
        else {
          this.client.createMessage(player.textChannelId as string, ':warning: Parece que o YouTube me impediu de tocar essa música!\nAguarda um momento enquanto resolvo esse problema e tenta novamente daqui a uns segundos.');
          player.destroy();
        }

        const appName = player.node!.options.hostname.split('.')[0];

        if (appName) {
          await this.client.request(`https://api.heroku.com/apps/${appName}/dynos`, {
            method: 'DELETE',
            headers: {
              'Accept': 'application/vnd.heroku+json; version=3',
              'Authorization': `Bearer ${process.env.HEROKUAPITOKEN}`
            }
          });
        }
        return;
      }
      player.textChannelId && this.client.createMessage(player.textChannelId, `:x: Ocorreu um erro ao tocar a música ${track.title}. Erro: \`${err.message}\``);
      console.error(`[Lavalink] Track Error on guild ${player.guildId}. Error: ${err.message}`);

      if (!player.errorCount) {
        player.errorCount = 0;
      } else ++player.errorCount;

      if (player.errorCount > 5) {
        player.destroy();
        return;
      }

      player.skip();
    });

    this.on('queueEnd', (player): void => {
      if (player.textChannelId) {
        const channel = this.client.getChannel(player.textChannelId);
        if (channel.type !== 0) return;

        if (player.lastPlayingMsgID) {
          const msg = channel.messages.get(player.lastPlayingMsgID);
          if (msg) msg.delete();
        }
        player.destroy();

        if (channel.permissionsOf(this.client.user.id).has('sendMessages'))
          channel.createMessage(`:bookmark_tabs: A lista de músicas acabou!`);
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
    const voiceChannelID = ctx.member!.voiceState.channelID;

    if (!voiceChannelID) {
      ctx.sendMessage({ content: ':x: Precisas de estar num canal de voz para executar esse comando!', flags: 1 << 6 });
      return false;
    }

    if (this.client.records.has(ctx.guild.id)) {
      ctx.sendMessage({ content: ':x: Não consigo tocar música enquanto gravo áudio!', flags: 1 << 6 });
      return false;
    }

    const voiceChannel = this.client.getChannel(voiceChannelID) as VoiceChannel;

    const permissions = voiceChannel.permissionsOf(this.client.user.id);

    if (!permissions.has('readMessages')) {
      ctx.sendMessage({ content: ':x: Não tenho permissão para ver o teu canal de voz!', flags: 1 << 6 });
      return false;
    }

    if (!permissions.has('voiceConnect')) {
      ctx.sendMessage({ content: ':x: Não tenho permissão para entrar no teu canal de voz!', flags: 1 << 6 });
      return false;
    }

    if (!permissions.has('voiceSpeak')) {
      ctx.sendMessage({ content: ':x: Não tenho permissão para falar no teu canal de voz!', flags: 1 << 6 });
      return false;
    }

    if (player && voiceChannelID !== player.voiceChannelId) {
      ctx.sendMessage({ content: ':x: Precisas de estar no meu canal de voz para usar este comando!', flags: 1 << 6 });
      return false;
    }

    if (player && !player.radio && player.queueDuration > 8.64e7) {
      ctx.sendMessage({ content: ':x: A queue tem a duração superior a 24 horas!', flags: 1 << 6 })
      return false;
    }
    return true;
  }

  async getRadioNowPlaying(radio: string) {
    let artist, songTitle;
    const xmlParser = new Parser();

    if (['CidadeHipHop', 'CidadeFM', 'RadioComercial', 'M80'].includes(radio)) {
      const xml = await this.client.request(`https://${radio === 'M80' ? 'm80' : radio === 'RadioComercial' ? 'radiocomercial' : 'cidade'}.iol.pt/nowplaying${radio === 'CidadeHipHop' ? '_Cidade_HipHop' : ''}.xml`).then(r => r.text());

      const text = await xmlParser.parseStringPromise(xml).then(t => t.RadioInfo.Table[0]);

      artist = text['DB_DALET_ARTIST_NAME'][0];
      songTitle = text['DB_DALET_TITLE_NAME'][0];
    } else if (radio === 'RFM') {
      const xml = await this.client.request('https://configsa01.blob.core.windows.net/rfm/rfmOnAir.xml').then(r => r.text('utf16le'));

      const text = await xmlParser.parseStringPromise(xml).then(parsed => parsed.music.song[0]);

      artist = text.artist[0];
      songTitle = text.name[0];
    }

    return { artist, songTitle };
  }

  init() {
    return super.start(this.client.user.id);
  }

  private pingNodes() {
    for (const node of this.nodes.values()) {
      if (node.options.hostname.includes('heroku')) {
        setInterval(() => {
          this.client.request(`http://${node.options.hostname}/version`, {
            headers: {
              Authorization: node.options.password!
            }
          })
        }, 25 * 60 * 1000);
      }
    }
  }

  private reconnect(node: Node) {
    node.disconnect();
    this.nodes.splice(this.nodes.indexOf(node), 1);

    const newNode = new Node(this, {
      id: node.identifier as string,
      hostname: node.options.hostname,
      port: node.options.port,
      password: node.options.password,
      maxRetryAttempts: 10,
      retryAttemptsInterval: 3000,
      secure: false,
      region: node.options.region
    })

    this.nodes.push(newNode);

    newNode.connect();
  }
}
