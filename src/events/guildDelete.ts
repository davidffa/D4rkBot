import Client from '../structures/Client';

import { Guild } from 'oceanic.js';

export default class GuildDelete {
  client: Client;

  constructor(client: Client) {
    this.client = client;
  }

  async run(guild: Guild) {
    this.client.guildDB.findOneAndDelete({ guildID: guild.id });
    this.client.guildCache.delete(guild.id);

    const embed = new this.client.embed()
      .setTitle(':frowning2: Saí de um servidor')
      .setColor('RANDOM')
      .addField('Nome', `\`${guild.name}\``, true)
      .addField(':crown: Dono', `\`${guild.ownerID && this.client.users.get(guild.ownerID)?.username}#${guild.ownerID && this.client.users.get(guild.ownerID)?.discriminator}\``, true)
      .addField(':closed_book: ID', `\`${guild.id}\``, true)
      .addField(':man: Membros', `\`${guild.members.size}\``, true)
      .setThumbnail(guild.iconURL() ?? '')
      .setTimestamp();

    const channel = await this.client.users.get('334054158879686657')?.createDM();

    channel && channel.createMessage({ embeds: [embed] });

    for (const collector of this.client.componentCollectors) {
      if (collector.message.guildID === guild.id) {
        collector.stop('Guild Delete');
      }
    }
  }
}