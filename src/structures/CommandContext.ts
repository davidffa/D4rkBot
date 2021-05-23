import Client from './Client';
import Interaction from './Interaction';

import { Message, Guild, GuildChannel, MessageContent, MessageFile, User, TextableChannel } from 'eris';

import { InteractionApplicationCommandCallbackData, IEditInteractionData } from '../typings/index';

export default class CommandContext {
  client: Client;
  msg: Message | Interaction;
  args: string[];

  sentMsg: Message;

  constructor(client: Client, message: Message|Interaction, args?: string[]) {
    this.client = client;
    this.msg = message;

    if (message instanceof Interaction) {
      this.args = message.args;
    }else {
      this.args = args || [];
    }
  }

  async sendMessage(content: MessageContent, file?: MessageFile): Promise<Message<TextableChannel>> {
    if (this.msg instanceof Message) {
      this.sentMsg = await this.msg.channel.createMessage(content, file);
      return this.sentMsg;
    }

    let cbData = {} as InteractionApplicationCommandCallbackData;

    if (typeof content === 'string') {
      cbData.content = '' + content;
    }else if (typeof content === 'object') {
      if (content.embed) {
        cbData.embeds = [content.embed];
        delete content.embed;
      }
      Object.assign(cbData, content);
    }else {
      return Promise.reject('No content provided');
    }

    const cb = {
      type: 4,
      data: cbData
    }

    await this.client.requestHandler.request('POST', `/interactions/${this.msg.id}/${this.msg.token}/callback`, true, cb, file);
    this.sentMsg = await this.client.requestHandler.request('GET', `/webhooks/${this.client.user.id}/${this.msg.token}/messages/@original`, true).then((message: any) => new Message(message, this.client));
    return this.sentMsg;
  }

  async editMessage(content: MessageContent, file?: MessageFile) {
    if (!(this.msg instanceof Interaction)) {
      if (!this.sentMsg) return Promise.reject('No message has been sent!');
      return this.sentMsg.edit(content);
    }

    const data = {} as IEditInteractionData;

    if (typeof content === 'string') data.content = '' + content;
    else if (typeof content === 'object') {
      if (content.embed) {
        data.embeds = [content.embed];
        delete content.embed;
      }
      Object.assign(data, content);
    }else {
      return Promise.reject('No content provided');
    }

    await this.client.requestHandler.request('PATCH', `/webhooks/${this.client.user.id}/${this.msg.token}/messages/@original`, true, data, file)
  }

  async waitInteraction() {
    if (!(this.msg instanceof Interaction)) return;
    const cb = {
      type: 5
    }

    await this.client.requestHandler.request('POST', `/interactions/${this.msg.id}/${this.msg.token}/callback`, true, cb);
  }

  get guild(): Guild | null {
    if (this.msg.channel instanceof GuildChannel) return this.msg.channel.guild;
    return null;
  }

  get author(): User {
    return this.msg.author;
  }

  get channel(): TextableChannel {
    return this.msg.channel;
  }
}