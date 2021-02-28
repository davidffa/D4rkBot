import Client from '../structures/Client';

import { Guild } from 'eris';

export default class GuildCreate {
    client: Client;

    constructor(client: Client) {
        this.client = client;
    }

    async run(guild: Guild) {
        this.client.guildCache.set(guild.id, {
            prefix: 'db.',
            disabledCmds: [],
            autoRole: '',
            welcomeChatID: '',
            memberRemoveChatID: '',
            djRole: '',
        });

        const embed = new this.client.embed()
            .setTitle('<:badgebooster:803666384373809233> Entrei num novo servidor')
            .setColor('RANDOM')
            .addField('Nome', `\`${guild.name}\``, true)
            .addField(':crown: Dono', `\`${this.client.users.get(guild.ownerID)?.username}#${this.client.users.get(guild.ownerID)?.discriminator}\``, true)
            .addField(':closed_book: ID', `\`${guild.id}\``, true )
            .addField(':man: Membros', `\`${guild.members.size}\``, true)
            .setThumbnail(guild.dynamicIconURL())
            .setTimestamp();

        const channel = await this.client.users.get('334054158879686657')?.getDMChannel();
        
        channel && this.client.createMessage(channel.id, { embed });
    }
}