import Client from '../structures/Client';

import { Member, VoiceChannel } from 'eris';

export default class VoiceChannelJoin {
    client: Client;

    constructor(client: Client) {
        this.client = client;
    }

    async run(member: Member, newChannel: VoiceChannel): Promise<void> {
        const player = this.client.music.players.get(member.guild.id);
        if (!player || member.bot) return;

        if (this.client.music.channelTimeouts.has(member.guild.id) && newChannel.id === player.voiceChannel) {
            player.pause(false);
            const data = this.client.music.channelTimeouts.get(member.guild.id);
            if (!data) return;
            clearTimeout(data.timeout);
            data.message.delete().catch(() => {});
            this.client.music.channelTimeouts.delete(member.guild.id);
        }
    } 
}