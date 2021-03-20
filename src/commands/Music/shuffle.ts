import Command from '../../structures/Command';
import Client from '../../structures/Client';

import { Message } from 'eris';

export default class Shuffle extends Command {
    constructor(client: Client) {
        super(client, {
            name: 'shuffle',
            description: 'Embaralha a lista de músicas.',
            category: 'Music',
            aliases: ['baralhar', 'embaralhar'],
            cooldown: 8,
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
        if (player.radio) {
            message.channel.createMessage(':x: Não podes usar este comando enquanto estiver a tocar uma rádio!');
            return;
        }

        const shuffle = (): void => {
            if (!player.queue.length) {
                message.channel.createMessage(':x: A queue está vazia!');
                return;
            }
            player.queue.shuffle();

            message.channel.createMessage('<a:disco:803678643661832233> Lista de músicas embaralhada!');
        }

        const isDJ = await this.client.music.hasDJRole(member);

        if (message.channel.guild.dbCache.djRole) {
            if (isDJ || voiceChannel.voiceMembers.filter(m => !m.bot).length === 1) {
                shuffle();
                return;
            }
            message.channel.createMessage(':x: Apenas alguém com o cargo DJ pode embaralhar a lista de músicas!');
        } else shuffle();
    }
}