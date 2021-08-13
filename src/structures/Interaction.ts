import Client from './Client';

import { TextChannel, User, Member } from 'eris';

import { InteractionPacket } from '../typings/index';

export default class Interaction {
  private client: Client;
  guildID: string;
  channel: TextChannel;
  author: User;
  member: Member;

  command: string;
  args: string[];

  token: string;
  id: string;
  type: number;

  constructor(client: Client, interaction: InteractionPacket) {
    this.client = client;

    this.guildID = interaction.guild_id;

    const channel = this.client.getChannel(interaction.channel_id);
    const user = this.client.users.get(interaction.member.user.id);

    if (!channel || channel.type !== 0) throw new Error('Channel is not a TextChannel!');
    if (!user) throw new Error('User not found!');

    this.channel = channel;
    this.author = user;

    const member = this.channel.guild.members.get(this.author.id);
    if (!member) throw new Error('Member not found!');

    this.member = member;

    this.id = interaction.id;
    this.token = interaction.token;
    this.type = interaction.type;

    this.command = interaction.data.name;

    this.args = [];

    if (interaction.data.options?.[0].type === 1) {
      this.args.push(interaction.data.options[0].name.trim());

      if (interaction.data.options?.[0].options) {
        for (const val of interaction.data.options?.[0].options) {
          this.args.push(val.value.trim());
        }
      }
    } else {
      this.args = interaction.data.options?.map(ops => ops.value.trim()) ?? [];
    }
  }
}