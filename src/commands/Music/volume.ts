import Command from '../../structures/Command';
import Client from '../../structures/Client';

import { Message } from 'eris';

export default class Volume extends Command {
    constructor(client: Client) {
        super(client, {
            name: 'volume',
            description: 'Altera o volume da música',
            category: 'Music',
            aliases: ['vol'],
            cooldown: 4,
        });
    }

    async execute(message: Message, args: Array<string>): Promise<void> {
        if (message.channel.type !== 0) return;

        const player = this.client.music.players.get(message.guildID as string);

        if (!player) {
            message.channel.createMessage(':x: Não estou a tocar nada de momento!');
            return;
        }

        if (!args.length) {
            message.channel.createMessage(`:speaker: Volume atual: \`${player.volume}\``);
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

        const setVolume = (vol: string): void => {
            if (!Number(vol)) {
                message.channel.createMessage(':x: Valor do volume inválido!');
                return;
            }

            if (Number(vol) <= 0 || Number(vol) > 200) {
                message.channel.createMessage(':x: O volume apenas pode variar entre 1 e 200');
                return;
            }

            player.setVolume(Number(vol))
            message.channel.createMessage(`:speaker: Volume da música setado para \`${vol}\``);
        }

        const isDJ = await this.client.music.hasDJRole(member);

        if (this.client.guildCache.get(message.guildID as string)?.djRole) {
            if (isDJ || message.author === player.queue.current?.requester || voiceChannel.voiceMembers.filter(m => !m.bot).length === 1) {
                setVolume(args[0]);
                return;
            }
            message.channel.createMessage(':x: Apenas quem requisitou esta música ou alguém com o cargo DJ pode alterar o volume!');
        } else setVolume(args[0]);
    }
}