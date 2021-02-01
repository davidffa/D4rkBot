import Command from '../../structures/Command';
import Client from '../../structures/Client';

import { Message } from 'eris';

class Pause extends Command {
    constructor(client: Client) {
        super(client, {
            name: 'pause',
            description: 'Pausa a música atual.',
            category: 'Music',
            aliases: ['pausa'],
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

        const pause = (): void => {
            if (player.paused) {
                message.channel.createMessage(':x: A música já está pausada!');
                return;
            } 

            player.pause(true);
            message.channel.createMessage(':pause_button: Música pausada!');
        }

        const isDJ = await this.client.music.hasDJRole(member)

        if (this.client.guildCache.get(message.guildID as string)?.djRole) {
            if (isDJ || voiceChannel.voiceMembers.filter(m => !m.bot).length === 1) {
                pause();
                return;
            }
            message.channel.createMessage(':x: Apenas alguém com o cargo DJ pode pausar a música!');
        } else pause();
    }
}

module.exports = Pause;