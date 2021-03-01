import Client from '../structures/Client';

import { Guild, Member } from 'eris';

export default class GuildMemberRemove {
    client: Client;

    constructor(client: Client) {
        this.client = client;
    }

    async run(guild: Guild, member: Member) {
        const guildData = guild.dbCache;
        
        if (guildData && guildData.memberRemoveChatID) {
            const channel = guild.channels.get(guildData.memberRemoveChatID);
            if (!channel) {
                guildData.memberRemoveChatID = '';
                const data = await this.client.guildDB.findOne({ guildID: guild.id });
                if (data) {
                    data.memberRemoveChatID = '';
                    data.save();
                }
                return;
            }

            if (channel.permissionsOf(this.client.user.id).has('sendMessages'))
                this.client.createMessage(channel.id, `O membro \`${member.username}#${member.discriminator}\` saiu do servidor.`);
        }
    }
}