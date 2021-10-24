import Client from './Client';
import { AdvancedMessageContent, Attachment, CommandInteraction, FileContent, Guild, InteractionDataOptionsWithValue, Member, Message, TextableChannel, User } from 'eris';

export enum Type {
  MESSAGE,
  INTERACTION
}

type Content = AdvancedMessageContent & {
  fetchReply?: boolean;
  files?: FileContent[];
}

export default class CommandContext {
  private readonly client: Client;
  private readonly interactionOrMessage: Message | CommandInteraction;
  private deferred: boolean;

  public type: Type;
  public args: string[] = [];
  public attachments: Attachment[];

  constructor(client: Client, interaction: Message | CommandInteraction, args: string[] = []) {
    this.client = client;
    this.interactionOrMessage = interaction;

    if (interaction instanceof Message) {
      this.type = Type.MESSAGE;

      this.args = args;
      this.attachments = interaction.attachments;
    } else {
      this.type = Type.INTERACTION;

      if (interaction.data.type === 1) {
        if (interaction.data.options?.[0].type === 1) {
          this.args.push(interaction.data.options[0].name.toString().trim());

          if (interaction.data.options[0].options) {
            for (const val of (interaction.data.options[0].options as InteractionDataOptionsWithValue[])) {
              this.args.push(val.value.toString().trim());
            }
          }
        } else {
          const options = interaction.data.options as InteractionDataOptionsWithValue[];

          this.args = options?.map(ops => ops.value.toString().trim()) ?? [];
        }
      } else if (interaction.data.type === 2) {
        this.args.push(interaction.data.target_id!);
      } else if (interaction.data.type === 3) {
        this.args = interaction.data.resolved!.messages!.get(interaction.data.target_id!)!.content.split(/ +/);
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
    return this.interactionOrMessage.channel;
  }

  async sendMessage(content: Content | string): Promise<Message<TextableChannel> | void> {
    content = this.formatContent(content);

    const fetchReply = !!content.fetchReply;
    const files = content.files;

    delete content.fetchReply;
    delete content.files;

    if (this.interactionOrMessage instanceof Message) {
      return this.channel.createMessage(content, files);
    } else {
      if (this.deferred) {
        await this.interactionOrMessage.editOriginalMessage({ ...content, file: files?.[0] });
      } else {
        await this.interactionOrMessage.createMessage({ ...content, file: files?.[0] });
      }

      if (fetchReply) {
        return this.interactionOrMessage.getOriginalMessage();
      }
    }
  }

  private formatContent(content: Content | string): Content {
    if (typeof content === 'string') return { content };
    return content;
  }

  async defer() {
    if (this.interactionOrMessage instanceof CommandInteraction) {
      this.interactionOrMessage.defer();
      this.deferred = true;
    }
  }
}