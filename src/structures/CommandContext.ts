import Client from './Client';

import { CommandInteraction, InteractionOptionsWithValue, Message } from 'oceanic.js'

import type {
  AnyTextableGuildChannel,
  Attachment,
  CreateMessageOptions,
  Guild,
  Member,
  PartialChannel,
  Role,
  TextableChannel,
  User
} from 'oceanic.js';

export enum Type {
  MESSAGE,
  INTERACTION
}

type Content = CreateMessageOptions & {
  fetchReply?: boolean;
}

export default class CommandContext {
  private readonly client: Client;
  private readonly interactionOrMessage: Message | CommandInteraction;
  private deferred: boolean;

  public readonly type: Type;
  public readonly args: string[] = [];
  public readonly attachments: Attachment[];

  declare public readonly targetUsers?: User[];
  declare public readonly targetRoles?: Role[];
  declare public readonly targetChannels?: PartialChannel[];

  constructor(client: Client, interaction: Message | CommandInteraction, args: string[] = []) {
    this.client = client;
    this.interactionOrMessage = interaction;

    if (interaction instanceof Message) {
      this.type = Type.MESSAGE;

      this.args = args;
      this.attachments = [...interaction.attachments.values()];
    } else {
      this.type = Type.INTERACTION;
      this.attachments = []; // TODO: support slash attachments

      if (interaction.data.type === 1) {
        if (interaction.data.options.raw?.[0]?.type === 1) {
          this.args.push(interaction.data.options.raw[0].name.toString().trim());

          if (interaction.data.options.raw[0].options) {
            for (const val of (interaction.data.options.raw[0].options)) {
              this.args.push((val as InteractionOptionsWithValue).value.toString().trim());
            }
          }
        } else {
          if (interaction.data.resolved?.users) {
            this.targetUsers = interaction.data.resolved?.users?.map(user => user);
          }

          if (interaction.data.resolved?.roles) {
            this.targetRoles = interaction.data.resolved?.roles?.map(role => role);
          }

          if (interaction.data.resolved?.channels) {
            this.targetChannels = interaction.data.resolved?.channels?.map(channel => channel);
          }

          const options = interaction.data.options.raw as InteractionOptionsWithValue[];

          this.args = options?.map(ops => ops.value.toString().trim()) ?? [];
        }
      } else if (interaction.data.type === 2) {
        // this.args.push(interaction.data.target_id!);
        this.targetUsers = interaction.data.resolved?.users?.map(user => user);
      } else if (interaction.data.type === 3) {
        this.args = interaction.data.resolved!.messages!.get(interaction.data.targetID!)!.content.split(/ +/);
      }
    }
  }

  get author(): User {
    if (this.interactionOrMessage instanceof Message) return this.interactionOrMessage.author;
    return this.interactionOrMessage.member!.user;
  }

  get member(): Member | null | undefined {
    return this.interactionOrMessage.member;
  }

  get guild(): Guild {
    return this.client.guilds.get(this.interactionOrMessage.guildID!)!
  }

  get channel(): TextableChannel {
    return this.interactionOrMessage.channel as TextableChannel;
  }

  async sendMessage(content: Content | string): Promise<Message<AnyTextableGuildChannel> | void> {
    content = this.formatContent(content);

    const fetchReply = !!content.fetchReply;

    delete content.fetchReply;

    if (content.content === undefined) content.content = '';

    if (this.interactionOrMessage instanceof Message) {
      return this.channel.createMessage(content);
    } else {
      // WARN You cannot attach files in an initial response. Defer the interaction, then use createFollowup.
      // ^ Emitted by OceanicJS when sending file attachments in an initial response.
      if (content.files?.length) {
        await this.defer();
        await this.interactionOrMessage.editOriginal(content);

        if (fetchReply) {
          return this.interactionOrMessage.getOriginal() as Promise<Message<AnyTextableGuildChannel>>;
        }

        return;
      }

      if (this.deferred) {
        await this.interactionOrMessage.editOriginal(content);
      } else {
        await this.interactionOrMessage.createMessage(content);
      }

      if (fetchReply) {
        return this.interactionOrMessage.getOriginal() as Promise<Message<AnyTextableGuildChannel>>;
      }
    }
  }

  private formatContent(content: Content | string): Content {
    if (typeof content === 'string') return { content };
    return content;
  }

  async defer() {
    if (this.interactionOrMessage instanceof CommandInteraction && !this.deferred) {
      await this.interactionOrMessage.defer();
      this.deferred = true;
    }
  }
}