import { Message, User, Guild } from 'eris';
import { MessageCollector } from 'eris-collector';

interface CommandOptions {
    name: string;
    description: string;
    aliases?: Array<string>;
    usage?: string;
    category?: string;
    dm?: boolean;
    args?: number;
    cooldown?: number;
}

interface Command extends CommandOptions {
    execute: (message: Message, args: Array<string>) => void;
}

interface Utils {
    findUser: (param: string, guild: Guild) => Promise<User|undefined>;
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

import 'eris';

declare module 'eris' {
    export interface Guild {
        dbCache: GuildCache;
    }
}

import 'erela.js';

declare module 'erela.js' {
    export interface Player {
        lastPlayingMsgID?: string;
        radio?: string;
    }
}