import Client from '../structures/Client';

import { Guild } from 'oceanic.js';

export default class GuildCreate {
  client: Client;

  constructor(client: Client) {
    this.client = client;
  }

  async run(guild: Guild) {
    this.client.guildCache.set(guild.id, {
      disabledCmds: [],
      autoRole: '',
      welcomeChatID: '',
      memberRemoveChatID: '',
      djRole: '',
      didUMean: true
    });

    const embed = new this.client.embed()
      .setTitle('<:badgebooster:803666384373809233> Entrei num novo servidor')
      .setColor('RANDOM')
      .addField('Nome', `\`${guild.name}\``, true)
      .addField(':crown: Dono', `\`${guild.ownerID && this.client.users.get(guild.ownerID)?.username}#${guild.ownerID && this.client.users.get(guild.ownerID)?.discriminator}\``, true)
      .addField(':closed_book: ID', `\`${guild.id}\``, true)
      .addField(':man: Membros', `\`${guild.members.size}\``, true)
      .setTimestamp();

    guild.iconURL() && embed.setThumbnail(guild.iconURL()!);

    const channel = await this.client.users.get('334054158879686657')?.createDM();

    channel && channel.createMessage({ embeds: [embed] });
  }
}