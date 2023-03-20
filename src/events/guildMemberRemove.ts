import Client from '../structures/Client';

import { Guild, Member, TextableChannel } from 'oceanic.js';

export default class GuildMemberRemove {
  client: Client;

  constructor(client: Client) {
    this.client = client;
  }

  async run(member: Member, guild: Guild) {
    const guildData = this.client.guildCache.get(guild.id);

    if (guildData && guildData.memberRemoveChatID) {
      const channel = guild.channels.get(guildData.memberRemoveChatID) as TextableChannel;
      if (!channel) {
        guildData.memberRemoveChatID = '';
        const data = await this.client.guildDB.findOne({ guildID: guild.id });
        if (data) {
          data.memberRemoveChatID = '';
          data.save();
        }
        return;
      }

      if ((guild.members.get(this.client.user.id)!.communicationDisabledUntil?.getTime() ?? 0) > Date.now()) return;

      if (channel.permissionsOf(this.client.user.id).has('SEND_MESSAGES')) {
        channel.createMessage({ content: `O membro \`${member.username}#${member.discriminator}\` saiu do servidor.` });
      }
    }
  }
}