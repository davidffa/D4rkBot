import { readdirSync, readFileSync, existsSync, unlinkSync } from 'fs';
import { resolve } from 'path';
import { Client, ClientOptions, User, Guild, Role, ClientEvents, TextChannel } from 'oceanic.js';
import { NodeOptions } from 'vulkava';

import Embed from './Embed';
import Music from './Music';

import levDistance from '../utils/levenshteinDistance';
import msToHour from '../utils/msToHour';
import msToDate from '../utils/msToDate';

import botDatabase from '../models/botDB';
import guildDatabase from '../models/guildDB';
import userDatabase from '../models/userDB';

import { ComponentCollector } from './Collector';

import { Command, Utils, GuildCache, IRecord } from '../typings/index';
import Logger from '../utils/Logger';

export default class D4rkClient extends Client {
  private readonly log: Logger;

  cacheLoaded: boolean;
  commands: Array<Command>;
  music: Music;
  utils: Utils;
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
  componentCollectors: Array<ComponentCollector>;
  records: Map<string, IRecord>;

  constructor() {
    const clientOptions: ClientOptions = {
      auth: process.env.TOKEN,
      defaultImageFormat: 'png',
      gateway: {
        getAllUsers: true,
        compress: "zlib-stream",
        intents: [
          'GUILDS',
          'GUILD_MEMBERS',
          'GUILD_EMOJIS_AND_STICKERS',
          'GUILD_VOICE_STATES',
          'GUILD_PRESENCES',
          'GUILD_MESSAGES',
          // 'MESSAGE_CONTENT',
        ]
      },
      collectionLimits: {
        messages: 10
      }
    };

    super(clientOptions);

    this.log = Logger.getLogger(this.constructor.name);

    this.editStatus('idle', [{
      name: 'A iniciar...',
      type: 3
    }]);

    this.cacheLoaded = false;
    this.commands = [];
    this.cooldowns = new Map();
    this.guildCache = new Map();
    this.lockedCmds = [];
    this.botDB = botDatabase;
    this.guildDB = guildDatabase;
    this.userDB = userDatabase;
    this.embed = Embed;
    this.componentCollectors = [];
    this.records = new Map();

    const findUser = async (param: string, guild: Guild | null): Promise<User | null> => {
      let user: User | null | undefined;

      const matched = param.match(/<@!?(\d{17,19})>/)

      if (matched) {
        try {
          user = this.users.get(matched[1]) || await this.rest.users.get(matched[1]);
        } catch { }
      } else if (/\d{17,19}/.test(param)) {
        try {
          user = this.users.get(param) || await this.rest.users.get(param);
        } catch { }
      }

      if (!guild) return null;

      if (!user) {
        const usernameRegex = /(.+)?#(\d{4})/;
        const match = param.match(usernameRegex);

        if (match) {
          if (match[1])
            user = guild.members.find(m => m.username === match[1] && m.user.discriminator === match[2])?.user;
          else
            user = guild.members.find(m => m.user.discriminator === match[2])?.user;
        }
      }

      if (!user) {
        const lowerCaseParam = param.toLowerCase();
        let startsWith = false;

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

          if (!startsWith && (m.nick && m.nick.toLowerCase().includes(lowerCaseParam) || m.username.toLowerCase().includes(lowerCaseParam))) {
            user = m.user;
          }
        }
      }
      return user || null;
    }

    const findRole = (param: string, guild: Guild): Role | null => {
      let role: Role | null | undefined;

      const matched = param.match(/<@&(\d{17,19})>/);

      if (matched) {
        role = guild.roles.get(matched[1]);
      } else if (/\d{17,19}/.test(param)) {
        role = guild.roles.get(param)
      }

      if (!role) {
        const lowerCaseParam = param.toLowerCase();
        let startsWith = false;

        for (const r of guild.roles.values()) {
          if (r.name === param || r.name.toLowerCase() === lowerCaseParam) return r;
          if (r.name.startsWith(param) || r.name.toLowerCase().startsWith(lowerCaseParam)) {
            role = r;
            startsWith = true;
            continue;
          }
          if (!startsWith && (r.name.includes(param) || r.name.toLowerCase().includes(lowerCaseParam))) return r;
        }
      }

      return role ?? null;
    }

    this.utils = {
      findUser,
      findRole,
      levenshteinDistance: levDistance,
      msToHour,
      msToDate
    }
  }

  loadCommands(): void {
    for (const dir of readdirSync(resolve(__dirname, '..', 'commands'))) {
      if (dir.endsWith('.ts') || dir.endsWith('.js')) {
        const cmd = require(`../commands/${dir}`).default;
        this.commands.push(new cmd(this));
      } else {
        for (const file of readdirSync(resolve(__dirname, '..', 'commands', dir))) {
          if (file.endsWith('.ts') || file.endsWith('.js')) {
            const command = require(`../commands/${dir}/${file}`).default;
            if (command.disabled) continue;
            this.commands.push(new command(this));
          }
        }
      }
    }
  }

  loadEvents(): void {
    for (const file of readdirSync(resolve(__dirname, '..', 'events'))) {
      if (file.endsWith('.ts') || file.endsWith('.js')) {
        const event = new (require(`../events/${file}`).default)(this);
        const eventName = file.split('.')[0] as keyof ClientEvents;

        if (eventName === 'ready') {
          super.once('ready', (...args) => event.run(...args));
        } else {
          super.on(eventName, (...args) => event.run(...args));
        }
      }
    }
  }

  connect(): Promise<void> {
    return super.connect();
  }

  connectLavaLink(): void {
    const nodes: NodeOptions[] = [
      {
        id: 'USA Node',
        hostname: process.env.USALAVALINKHOST,
        port: 2333,
        password: process.env.LAVALINKPASSWORD,
        maxRetryAttempts: 5,
        retryAttemptsInterval: 6000,
        secure: false,
        region: 'USA',
        resumeKey: 'D4rkBot'
      }
    ];

    this.music = new Music(this, nodes);

    this.music.init();
    super.on('packet', (packet) => this.music.handleVoiceUpdate(packet));
  }

  async loadBotCache(): Promise<void> {
    const guildsDB = await this.guildDB.find({});

    this.guilds.forEach((guild): void => {
      const guildData = guildsDB.find(g => g.guildID === guild.id);

      this.guildCache.set(guild.id, {
        disabledCmds: guildData?.disabledCmds ?? [],
        autoRole: guildData?.roleID ?? '',
        welcomeChatID: guildData?.welcomeChatID ?? '',
        memberRemoveChatID: guildData?.memberRemoveChatID ?? '',
        djRole: guildData?.djrole ?? '',
        didUMean: guildData?.didumean ?? true
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

    this.cacheLoaded = true;

    this.log.info('Guild Cache carregada.');
  }

  loadStatus(): void {
    let id = 0;

    const task = async () => {
      switch (id) {
        case 0:
          this.editStatus('dnd', [{
            name: 'D4rkB#5745',
            type: 3
          }]);
          break;
        case 1:
          this.editStatus('online', [{
            name: `${this.guilds.size} Servidores`,
            type: 3
          }]);
          break;
        case 2:
          this.editStatus('online', [{
            name: `${this.users.size} Utilizadores`,
            type: 3
          }]);
          break;
        case 3:
          this.editStatus('online', [{
            name: `${Object.keys(this.channelGuildMap).length} Canais`,
            type: 1,
            url: ''
          }]);
          break;
        case 4:
          this.editStatus('online', [{
            name: `@D4rkBot`,
            type: 0
          }]);
          break;
        case 5:
          this.editStatus('online', [{
            name: `${this.music.players.size} músicas`,
            type: 2
          }]);
          break;
        case 6:
          this.editStatus('online', [{
            name: `Online há ${this.utils.msToDate(process.uptime() * 1e3)}`,
            type: 1,
            url: ''
          }]);
          break;
        case 7:
          this.editStatus('online', [{
            name: `${this.commandsUsed} comandos executados`,
            type: 3
          }]);
          break;
      }
      id = id % 7 + 1;
    }

    task();
    setInterval(() => task(), 30000);
  }

  async loadLogs(): Promise<void> {
    const logPath = resolve(__dirname, '..', '..', 'logs', 'log.txt');

    if (existsSync(logPath))
      unlinkSync(logPath);

    const channel = this.getChannel('775420724990705736') as TextChannel;

    setInterval(async (): Promise<void> => {
      if (!existsSync(logPath)) return;

      const buffer = readFileSync(logPath);

      await channel.createMessage({
        content: `:bookmark_tabs: Log dos comandos.\nData: <t:${Math.floor(Date.now() / 1e3)}>`,
        files: [{
          name: 'log.txt',
          contents: buffer
        }]
      });
      unlinkSync(logPath);
    }, 7.2e6);
  }
}
