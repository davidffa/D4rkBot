import { readdirSync, unlinkSync, existsSync, readFileSync } from 'fs';
import { resolve } from 'path';
import { Client, ClientOptions, User, Guild, Constants } from 'eris';
import { NodeOptions, VoicePacket } from 'erela.js';

import Embed from './Embed';
import Music from './Music';
import levDistance from '../utils/levenshteinDistance';
import msToHour from '../utils/msToHour';
import msToDate from '../utils/msToDate';
import botDatabase from '../models/botDB';
import guildDatabase from '../models/guildDB';
import userDatabase from '../models/userDB';
import { ReactionCollector, MessageCollector } from './Collector';

import { Command, Utils, Records, GuildCache } from '../typings/index';

export default class D4rkClient extends Client {
  commands: Array<Command>;
  music: Music;
  utils: Utils;
  records: Map<string, Records>;
  cooldowns: Map<string, Map<string, number>>;
  blacklist: Array<string>;
  guildCache: Map<string, GuildCache>;
  commandsUsed: number;
  private lastCmdsUsed: number;
  lockedCmds: Array<string>;
  botDB: typeof botDatabase;
  guildDB: typeof guildDatabase;
  userDB: typeof userDatabase;
  embed: typeof Embed;
  reactionCollectors: Array<ReactionCollector>;
  messageCollectors: Array<MessageCollector>;

  constructor() {
    const clientOptions: ClientOptions = {
      defaultImageFormat: 'png',
      defaultImageSize: Constants.ImageSizeBoundaries.MAXIMUM,
      getAllUsers: true,
      restMode: true,
      compress: true,
      intents: [
        'guilds',
        'guildMembers',
        'guildEmojis',
        'guildVoiceStates',
        'guildPresences',
        'guildMessages',
        'guildMessageReactions',
        'directMessages',
        'directMessageReactions'
      ],
    }

    super(process.env.TOKEN as string, clientOptions);

    this.commands = [];
    this.records = new Map();
    this.cooldowns = new Map();
    this.guildCache = new Map();
    this.lockedCmds = [];
    this.botDB = botDatabase;
    this.guildDB = guildDatabase;
    this.userDB = userDatabase;
    this.embed = Embed;
    this.reactionCollectors = [];
    this.messageCollectors = [];

    const findUser = async (param: string, guild: Guild | null): Promise<User | null> => {
      let user: User | null | undefined;

      if (/<@!?\d{17,18}>/.test(param)) {
        const matched = param.match(/\d{17,18}/)?.[0]

        if (matched) param = matched
      }

      if (/\d{17,18}/.test(param)) {
        try {
          user = this.users.get(param) || await this.getRESTUser(param);
        } catch { }
      }

      if (!guild) return null;

      if (!user && /^#?[0-9]{4}$/g.test(param)) {
        user = guild.members.find(m => m.user.discriminator === param.replace(/#/, ''))?.user;
      }

      if (!user) {
        let startsWith = false;
        const lowerCaseParam = param.toLowerCase();

        for (const m of guild.members.values()) {
          if ((m.nick && (m.nick === param || m.nick.toLowerCase() === param.toLowerCase())) || m.username === param || m.username.toLowerCase() === param.toLowerCase()) {
            user = m.user;
            break;
          }

          if ((m.nick && m.nick.startsWith(lowerCaseParam)) || m.username.toLowerCase().startsWith(lowerCaseParam)) {
            user = m.user;
            startsWith = true;
            continue;
          }

          if (!startsWith && (m.nick && m.nick.toLowerCase().includes(lowerCaseParam)) || m.username.toLowerCase().includes(lowerCaseParam)) {
            user = m.user;
          }
        }
      }
      return user || null;
    }

    this.utils = {
      findUser,
      levenshteinDistance: levDistance,
      msToHour,
      msToDate
    }
  }

  loadCommands(): void {
    readdirSync('./src/commands').forEach(dir => {
      if (dir.endsWith('.ts')) {
        const cmd = require(`../commands/${dir}`).default;
        this.commands.push(new cmd(this));
      } else {
        readdirSync(`./src/commands/${dir}`).filter(file => file.endsWith('.ts')).forEach(file => {
          const command = require(`../commands/${dir}/${file}`).default;
          this.commands.push(new command(this));
        });
      }
    });
  }

  loadEvents(): void {
    readdirSync('./src/events').filter(file => file.endsWith('.ts')).forEach(file => {
      const event = new (require(`../events/${file}`).default)(this);
      const eventName = file.split('.')[0];

      if (eventName === 'ready') {
        super.once('ready', (...args) => event.run(...args));
      } else {
        super.on(eventName, (...args) => event.run(...args));
      }
    })
  }

  connect(): Promise<void> {
    return super.connect();
  }

  connectLavaLink(): void {
    const nodes: NodeOptions[] = [
      {
        identifier: 'Node 1',
        host: process.env.LAVALINKHOST as string,
        port: Number(process.env.LAVALINKPORT),
        password: process.env.LAVALINKPASSWORD as string,
        retryAmount: 10,
        retryDelay: 3000,
        secure: false
      }
    ];

    this.music = new Music(this, nodes);

    this.music.init();
    super.on('rawWS', (packet) => this.music.updateVoiceState(packet as VoicePacket));
  }

  async loadBotCache(): Promise<void> {
    const guildsDB = await this.guildDB.find({});

    this.guilds.forEach((guild): void => {
      const guildData = guildsDB.find(g => g.guildID === guild.id);

      this.guildCache.set(guild.id, {
        prefix: guildData?.prefix || 'db.',
        disabledCmds: guildData?.disabledCmds || [],
        autoRole: guildData?.roleID || '',
        welcomeChatID: guildData?.welcomeChatID || '',
        memberRemoveChatID: guildData?.memberRemoveChatID || '',
        djRole: guildData?.djrole || '',
      });
    });

    let bot = await this.botDB.findOne({ botID: this.user.id });

    if (!bot) {
      bot = await this.botDB.create({ botID: this.user.id });
    }
    
    if (!bot.blacklist) {
      bot.blacklist = [];
      bot.save();
    }

    this.blacklist = [...bot?.blacklist] || [];
    this.lastCmdsUsed = bot?.commands || 0;
    this.commandsUsed = bot?.commands || 0;
    if (bot?.lockedCmds) this.lockedCmds = bot.lockedCmds;

    //save total cmds used to database
    setInterval(async (): Promise<void> => {
      if (this.lastCmdsUsed < this.commandsUsed) {
        await this.botDB.updateOne({
          botID: this.user.id
        }, {
          commands: this.commandsUsed
        });
        this.lastCmdsUsed = this.commandsUsed;
      }
    }, 3e5);

    console.log('Guild Cache carregada.');
  }

  loadStatus(): void {
    let id = 0;

    setInterval(async (): Promise<void> => {
      switch (id) {
        case 0:
          this.editStatus('dnd', {
            name: 'D4rkB#2408',
            type: 3
          });
          break;
        case 1:
          this.editStatus('online', {
            name: `${this.guilds.size} Servidores`,
            type: 3
          });
          break;
        case 2:
          this.editStatus('online', {
            name: `${this.users.size} Utilizadores`,
            type: 3
          });
          break;
        case 3:
          this.editStatus('online', {
            name: `${Object.keys(this.channelGuildMap).length} Canais`,
            type: 1
          });
          break;
        case 4:
          this.editStatus('online', {
            name: `@D4rkBot`,
            type: 0
          });
          break;
        case 5:
          this.editStatus('online', {
            name: `${this.music.players.size} músicas`,
            type: 2
          });
          break;
        case 6:
          this.editStatus('online', {
            name: `Online há ${this.utils.msToDate(process.uptime() * 1e3)}`,
            type: 1
          });
          break;
        case 7:
          this.editStatus('online', {
            name: `${this.commandsUsed} comandos executados`,
            type: 3
          });
          break;
        default:
          id = -1;
          break;
      }
      id++;
    }, 30000);
  }

  async loadLogs(): Promise<void> {
    const logPath = resolve(__dirname, '..', '..', 'logs', 'log.txt');

    if (existsSync(logPath))
      unlinkSync(logPath);

    setInterval(async (): Promise<void> => {
      if (!existsSync(logPath)) return;

      const buffer = readFileSync(logPath);

      await this.createMessage('775420724990705736',
        `:bookmark_tabs: Log dos comandos.\nData: <t:${Math.floor(Date.now() / 1e3)}>`, {
        name: 'log.txt',
        file: buffer
      }
      );
      unlinkSync(logPath);
    }, 7.2e6);
  }
}