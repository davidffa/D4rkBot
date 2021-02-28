import Client from '../structures/Client';

import { Member, VoiceChannel } from 'eris';

export default class VoiceChannelLeave {
    client: Client;

    constructor(client: Client) {
        this.client = client;
    }

    async run(member: Member, oldChannel: VoiceChannel): Promise<void> {
        const player = this.client.music.players.get(member.guild.id);
        if (!player) return;

        if (member.id === this.client.user.id) {
            this.client.createMessage(player.textChannel as string, ':warning: Fui desconectado do canal de voz, por isso limpei a queue.');
            player.destroy();

            const data = this.client.music.channelTimeouts.get(member.guild.id);
            if (!data) return;
            clearTimeout(data.timeout);
            data.message.delete().catch(() => { });
            this.client.music.channelTimeouts.delete(member.guild.id);

            return;
        }

        if (oldChannel.id === player.voiceChannel && !oldChannel.voiceMembers.filter(m => !m.bot).length && oldChannel.id !== process.env.VOICECHANNELID) {
            player.pause(true);
            const msg = await this.client.createMessage(player.textChannel as string, ':warning: Pausei a música porque fiquei sozinho no canal de voz, se ninguem aparecer irei sair em 2 minutos.');

            const timeout = setTimeout(() => {
                this.client.createMessage(player.textChannel as string, ':x: Saí do canal de voz porque fiquei sozinho mais de 2 minutos');
                player.destroy();
                this.client.music.channelTimeouts.get(member.guild.id)?.message.delete().catch(() => { });
                this.client.music.channelTimeouts.delete(member.guild.id);
            }, 2 * 60 * 1000);

            this.client.music.channelTimeouts.set(member.guild.id, { timeout, message: msg });
        }
    }
}