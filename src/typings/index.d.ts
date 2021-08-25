import { Message, User, Guild, AllowedMentions, EmbedOptions, MessageFile } from 'eris';
import { MessageCollector } from 'eris-collector';
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
}

interface Utils {
  findUser: (param: string, guild: Guild | null) => Promise<User | null>;
  levenshteinDistance: (src: string, target: string) => number;
  msToHour: (time: number) => string;
  msToDate: (time: number) => string;
}

interface Timeouts {
  timeout: NodeJS.Timeout;
  message: Message;
}

interface MsgCollectors {
  messageCollector: MessageCollector;
  message: Message;
}

interface GuildCache {
  prefix: string;
  disabledCmds: Array<string>;
  autoRole: string;
  welcomeChatID: string;
  memberRemoveChatID: string;
  djRole: string;
}

interface Records {
  timeout: NodeJS.Timeout;
  users: Array<string>;
}

interface InteractionOptions {
  name: string;
  value: string;
  type: number;
  options?: InteractionOptions[];
}

interface InteractionResolved {
  messages: Record<string, {
    content: string // only need content :>
  }>;
  // users & members: <- don't need for now
}

interface InteractionData {
  id: string;
  name: string;
  type: number;
  options?: InteractionOptions[];
  resolved?: InteractionResolved;
  target_id?: string;
}

interface InteractionPacket {
  application_id: string;
  channel_id: string;
  id: string;
  guild_id: string;

  data: InteractionData;

  member: { user: { id: string; } }; //dont need more stuff (for now)

  token: string;
  type: number;
  version: number;
}

interface InteractionApplicationCommandCallbackData {
  tts?: boolean;
  content?: string;
  embeds?: EmbedOptions[];
  allowed_mentions?: AllowedMentions;
  flags?: number;
}

interface IEditInteractionData {
  [key: string]: string;
  content?: string;
  embeds?: EmbedOptions[];
  file?: MessageFile;
}

import 'erela.js';

type Effect = 'bass' | 'pop' | 'soft' | 'treblebass' | 'nightcore' | 'vaporwave';

declare module 'erela.js' {
  export interface Player {
    lastPlayingMsgID?: string;
    radio?: string;
    djTableMsg?: Message;
    reconnect?: boolean;
    errorCount?: number;
    effects: Effect[];
  }
}