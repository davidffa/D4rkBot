import { EventEmitter } from 'events';
import Client from './Client';
import { Message, ComponentInteraction } from 'eris';

declare function ComponentCollectorFilter(interaction: ComponentInteraction): boolean;

interface CollectorEventListener<T> {
  (event: 'end', listener: (reason: string) => void): T;
  (event: string, listener: Function): T;
}
interface ComponentCollectorEventListeners<T> extends CollectorEventListener<T> {
  (event: 'collect', listener: (interaction: ComponentInteraction) => void): T;
}

export interface ComponentCollector {
  on: ComponentCollectorEventListeners<this>;
  once: ComponentCollectorEventListeners<this>;
}

interface CollectorOptions {
  max?: number;
  time?: number;
}

export class ComponentCollector extends EventEmitter {
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