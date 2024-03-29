import Client from './Client';
import { CommandOptions } from '../typings';

export default class Command implements CommandOptions {
  client: Client;

  name: string;
  description: string;
  aliases?: Array<string>;
  usage?: string;
  category?: 'Moderation' | 'Settings' | 'Dev' | 'Info' | 'Others' | 'Music';
  args?: number;
  cooldown: number;

  constructor(client: Client, options: CommandOptions) {
    this.client = client;

    this.name = options.name;
    this.description = options.description || 'Sem descrição';
    this.aliases = options.aliases;
    this.usage = options.usage;
    this.category = options.category;
    this.args = options.args;
    this.cooldown = options.cooldown || 3;
  }
}