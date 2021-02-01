declare module 'eris-collector' {
    import { Message, User, Channel, Guild, Emoji, Client, Member } from 'eris';
    import Emitter from 'events';

    interface Options {
        time: number;
    }

    interface TimerOptions {
        time?: ReturnType<typeof setTimeout>;
        idle?: ReturnType<typeof setTimeout>;
    }

    interface ReactionCollectorFilter {
        (message: Message, emoji: Emoji, member: Member): boolean;
    }

    interface MessageCollectorFilter {
        (message: Message): boolean;
    }

    declare class BaseCollector extends Emitter {
        constructor(filter, options);

        _timeouts: set<ReturnType<typeof setTimeout>>;
        filter: ReactionCollectorFilter|MessageCollectorFilter;
        options: Options;
        collected: Map<string, string>;
        ended: boolean;
        _timeout: ReturnType<typeof setTimeout>|null;
        _idletimeout: ReturnType<typeof setTimeout>|null;

        setTimeout: (fn: Function, delay: number, ...args: any) => ReturnType<typeof setTimeout>
        clearTimeout: (timeout: ReturnType<typeof setTimeout>) => void;
        handleCollect: (...args: any) => void;
        handleDispose: (...args: any) => void;
        next: () => Promise<void>;
        stop: (reason: string) => void;
        resetTimer: (obj: TimerOptions) => void;
        checkEnd: () => void;
        collect: () => void;
        dispose: () => void;
        endReason: () => void;

        _handleChannelDeletion: (channel: Channel) => void;
        _handleGuildDeletion: (guild: Guild) => void;
    }

    interface ReactionCollectorOptions extends Options {
        max?: number;
        maxEmojis?: number;
        maxUsers?: number;
    }

    declare class ReactionCollector extends BaseCollector {
        constructor(client: Client, message: Message, filter: ReactionCollectorFilter, options: ReactionCollectorOptions);

        message: Message;
        users: Map<string, User>;
        total: number;
        options: ReactionCollectorOptions;

        collect: (message: Message, emoji: Emoji) => string|null;
        dispose: (message: Message, emoji: Emoji, userID: string) => string|null;
        empty: () => void;
        endReason: () => string|null;

        _handleMessageDeletion: (message: Message) => void;
        
        key: (emoji: Emoji) => string; 

        on(event: 'collect', func: (message: Message, emoji: Emoji, member: Member) => void);
        on(event: 'end', func: (collected: Map<string, Message>, reason: string) => void);
        on(event: 'dispose', ...args: any); //
        on(event: 'remove', ...args: any); //
    }

    interface MessageCollectorOptions extends Options {
        max?: number;
        maxProcessed?: number;
    }

    declare class MessageCollector extends BaseCollector {
        constructor(client: Client, channel: Channel, filter: MessageCollectorFilter, options: MessageCollectorOptions);

        channel: Channel;
        received: number;
        
        collect: (message: Message) => string;
        dispose: (message: Message) => string|null;
        endReason: () => string|null;

        on(event: 'collect', func: (message: Message) => void);
        on(event: 'end', func: (collected: Map<string, Message>, reason: string) => void);
        on(event: 'dispose', func: (message: Message) => void);
    }
}