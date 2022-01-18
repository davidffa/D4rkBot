import type { Message, User, Guild, AllowedMentions, EmbedOptions, MessageFile, AutocompleteInteraction } from 'eris';
import CommandContext from '../structures/CommandContext';

interface CommandOptions {
  name: string;
  description: string;
  aliases?: Array<string>;
  usage?: string;
  category?: 'Moderation' | 'Settings' | 'Dev' | 'Info' | 'Others' | 'Music';
  dm?: boolean;
  args?: number;
  cooldown?: number;
}

interface Command extends CommandOptions {
  execute: (ctx: CommandContext) => void;
  runAutoComplete?: (interaction: AutocompleteInteraction, value: string, options?: any) => void;
}

interface Utils {
  findUser: (param: string, guild: Guild | null) => Promise<User | null>;
  findRole: (param: string, guild: Guild) => Role | null;
  levenshteinDistance: (src: string, target: string) => number;
  msToHour: (time: number) => string;
  msToDate: (time: number) => string;
}

interface Timeouts {
  timeout: NodeJS.Timeout;
  message: Message;
}

interface ComponentCollectors {
  collector: ComponentCollector;
  message: Message;
}

interface GuildCache {
  prefix: string;
  disabledCmds: Array<string>;
  autoRole: string;
  welcomeChatID: string;
  memberRemoveChatID: string;
  djRole: string;
  didUMean: boolean;
}

interface Choices {
  name: string;
  value: string;
}

import { Worker } from 'worker_threads';
interface IRecord {
  timeout: NodeJS.Timeout;
  worker: Worker;
  voiceChannelID: string;
}

import 'vulkava';

type Effect = 'bass' | 'pop' | 'soft' | 'treblebass' | 'nightcore' | 'vaporwave' | 'lowpass' | '8D';

declare module 'vulkava' {
  export interface Player {
    lastPlayingMsgID?: string;
    radio?: string;
    djTableMsg?: Message;
    reconnect?: boolean;
    errorCount?: number;
    effects: Effect[];
  }
}

import 'color-thief-node';
import type { Image } from 'canvas';

declare module 'color-thief-node' {
  export function getPalette(sourceImage: Image, colorCount?: number, quality?: number): Palette[];
}