import EventEmitter3 from 'eventemitter3';
import Client from './Client';
import { Message, ComponentInteraction, TextableChannel } from 'eris';

declare function ComponentCollectorFilter(interaction: ComponentInteraction): boolean;
// declare function ReactionCollectorFilter(reaction: Emoji, user: User): boolean;
declare function MessageCollectorFilter(message: Message): boolean;

interface CollectorEventListener<T> {
  (event: 'end', listener: (reason: string) => void): T;
  (event: string, listener: Function): T;
}

// interface ReactionCollectorEventListeners<T> extends CollectorEventListener<T> {
//   (event: 'collect', listener: (reaction: Emoji, user: User) => void): T;
//   (event: 'remove', listener: (reaction: Emoji, user: User) => void): T;
// }

interface MessageCollectorEventListeners<T> extends CollectorEventListener<T> {
  (event: 'collect', listener: (message: Message) => void): T;
}

interface ComponentCollectorEventListeners<T> extends CollectorEventListener<T> {
  (event: 'collect', listener: (interaction: ComponentInteraction) => void): T;
}

// export interface ReactionCollector {
//   on: ReactionCollectorEventListeners<this>;
//   once: ReactionCollectorEventListeners<this>;
// }

export interface MessageCollector {
  on: MessageCollectorEventListeners<this>;
  once: MessageCollectorEventListeners<this>;
}

export interface ComponentCollector {
  on: ComponentCollectorEventListeners<this>;
  once: ComponentCollectorEventListeners<this>;
}

interface CollectorOptions {
  max?: number;
  time?: number;
}

// export class ReactionCollector extends EventEmitter3 {
//   client: Client;
//   message: Message;
//   filter?: typeof ReactionCollectorFilter;
//   options: CollectorOptions;
//   timeout?: NodeJS.Timeout;
//   reactionCount: number;

//   constructor(client: Client, message: Message, filter?: typeof ReactionCollectorFilter, options: CollectorOptions = {}) {
//     super();
//     this.client = client;
//     this.message = message;
//     this.filter = filter;
//     this.options = options;
//     this.reactionCount = 0;

//     if (this.options.time) {
//       this.timeout = setTimeout(() => {
//         this.stop('Time');
//         delete this.timeout;
//       }, this.options.time);
//     }

//     client.reactionCollectors.push(this);
//   }

//   collect(reaction: Emoji, user: User) {
//     if (this.filter && this.filter(reaction, user)) {
//       this.reactionCount++;
//       this.emit('collect', reaction, user);

//       if (this.options.max && this.reactionCount === this.options.max)
//         this.stop('Max');
//     }
//   }

//   remove(reaction: Emoji, user: User) {
//     if (this.filter && this.filter(reaction, user)) {
//       this.reactionCount++;
//       this.emit('remove', reaction, user);

//       if (this.options.max && this.reactionCount === this.options.max)
//         this.stop('Max');
//     }
//   }

//   stop(reason: string = 'Manual') {
//     if (this.timeout) {
//       clearTimeout(this.timeout);
//     }
//     this.emit('end', reason);
//     this.client.reactionCollectors.splice(this.client.reactionCollectors.indexOf(this), 1)
//   }
// }

export class MessageCollector extends EventEmitter3 {
  client: Client;
  channel: TextableChannel;
  filter?: typeof MessageCollectorFilter;
  options: CollectorOptions;
  timeout?: NodeJS.Timeout;
  messageCount: number;

  constructor(client: Client, channel: TextableChannel, filter?: typeof MessageCollectorFilter, options: CollectorOptions = {}) {
    super();
    this.client = client;
    this.channel = channel;
    this.filter = filter;
    this.options = options;
    this.messageCount = 0;

    if (this.options.time) {
      this.timeout = setTimeout(() => {
        this.stop('Time');
        delete this.timeout;
      }, this.options.time);
    }

    client.messageCollectors.push(this);
  }

  collect(message: Message) {
    if (this.filter && this.filter(message)) {
      this.messageCount++;
      this.emit('collect', message);

      if (this.options.max && this.messageCount === this.options.max)
        this.stop('Max');
    }
  }

  stop(reason: string = 'Manual') {
    if (this.timeout) {
      clearTimeout(this.timeout);
    }
    this.emit('end', reason);
    this.client.messageCollectors.splice(this.client.messageCollectors.indexOf(this), 1)
  }
}

export class ComponentCollector extends EventEmitter3 {
  client: Client;
  message: Message;
  filter?: typeof ComponentCollectorFilter;
  options: CollectorOptions;
  timeout?: NodeJS.Timeout;
  interactionCount: number;

  constructor(client: Client, message: Message, filter?: typeof ComponentCollectorFilter, options: CollectorOptions = {}) {
    super();
    this.client = client;
    this.message = message;
    this.filter = filter;
    this.options = options;
    this.interactionCount = 0;

    if (this.options.time) {
      this.timeout = setTimeout(() => {
        this.stop('Time');
        delete this.timeout;
      }, this.options.time);
    }

    client.componentCollectors.push(this);
  }

  collect(interaction: ComponentInteraction) {
    if (this.filter && this.filter(interaction)) {
      this.interactionCount++;
      this.emit('collect', interaction);

      if (this.options.max && this.interactionCount === this.options.max)
        this.stop('Max');
    } else {
      interaction.createMessage({ content: 'Não podes interagir aqui!', flags: 1 << 6 });
    }
  }

  stop(reason: string = 'Manual') {
    if (this.timeout) {
      clearTimeout(this.timeout);
    }
    this.emit('end', reason);
    this.client.componentCollectors.splice(this.client.componentCollectors.indexOf(this), 1)
  }
}