import { Message, User, Guild } from 'eris';
import { MessageCollector } from 'eris-collector';

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
    execute: (message: Message, args: Array<string>) => void;
}

interface Utils {
    findUser: (param: string, guild: Guild) => Promise<User | null>;
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

import 'erela.js';

interface Timescale {
    pitch: number;
    rate?: number;
    speed?: number;
}

interface Bands {
    band: number;
    gain: number;
}

type Equalizer = Bands[];

interface Tremolo {
    depth: number;
    frequency: number;
}

interface Karaoke {
    level: number;
    monoLevel: number;
    filterBand: number;
    filterWidth: number;
}

interface Filter {
    timescale?: Timescale;
    equalizer?: Equalizer;
    tremolo?: Tremolo;
    karaoke?: Karaoke;
}

type Effect = 'bass' | 'pop' | 'soft' | 'treblebass' | 'nightcore' | 'vaporwave';

interface Filters {
    effects: Effect[];
    clearFilters(): this;
    setFilters(filter: Filter): this;
    addEffect(effect: Effect): this;
    removeEffect(effect: Effect): this;
}

declare module 'erela.js' {
    export interface Player {
        lastPlayingMsgID?: string;
        radio?: string;
        djTableMsg?: Message;
        filters: Filters;
    }
}