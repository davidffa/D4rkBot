import Command from '../../structures/Command';
import Client from '../../structures/Client';

import { Message } from 'eris';

class Resume extends Command {
    constructor(client: Client) {
        super(client, {
            name: 'resume',
            description: 'Retoma a música atual.',
            category: 'Music',
            aliases: ['retomar'],
            cooldown: 4,
        });
    }

    async execute(message: Message): Promise<void> {
        if (message.channel.type !== 0) return;

        const player = this.client.music.players.get(message.guildID as string);

        if (!player) {
            message.channel.createMessage(':x: Não estou a tocar nada de momento!');
            return;
        }

        const voiceChannelID = message.member?.voiceState.channelID;

        if (!voiceChannelID || (voiceChannelID && voiceChannelID !== player.voiceChannel)) {
            message.channel.createMessage(':x: Precisas de estar no meu canal de voz para usar esse comando!');
            return;
        }

        const voiceChannel = this.client.getChannel(voiceChannelID);

        if (voiceChannel.type !== 2) return;

        const member = message.member;
        if (!member) return;

        const resume = (): void => {
            if (!player.paused) {
                message.channel.createMessage(':x: A música já está a tocar!');
                return;
            } 

            player.pause(false);
            message.channel.createMessage(':play_pause: Música retomada!');
        }

        const isDJ = await this.client.music.hasDJRole(member);

        if (this.client.guildCache.get(message.guildID as string)?.djRole) {
            if (isDJ || voiceChannel.voiceMembers.filter(m => !m.bot).length === 1) {
                resume();
                return;
            }
            message.channel.createMessage(':x: Apenas alguém com o cargo DJ pode retomar a música!');
        } else resume();
    }
}

module.exports = Resume;