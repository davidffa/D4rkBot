import Command from '../../structures/Command';
import Client from '../../structures/Client';

import { Message } from 'eris';

export default class Skip extends Command {
    constructor(client: Client) {
        super(client, {
            name: 'skip',
            description: 'Pula a música atual.',
            category: 'Music',
            aliases: ['s', 'pular'],
            cooldown: 2,
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

        const skip = (dj: Boolean): void => {
            player.stop();

            if (!player.queue[0]) {
                player.destroy();
                message.channel.createMessage(':bookmark_tabs: A lista de músicas acabou!');
                return;
            }
            message.channel.createMessage(dj ? ':fast_forward: Música pulada por um DJ!' : ':fast_forward: Música pulada!');
        }

        const member = message.member
        if (!member) return;

        if (await this.client.music.hasDJRole(member)) {
            skip(true);
        }else {
            if (this.client.guildCache.get(message.guildID as string)?.djRole) {
                if (message.author === player.queue.current?.requester || voiceChannel.voiceMembers.filter(m => !m.bot).length === 1) {
                    skip(false);
                    return;
                }
                message.channel.createMessage(':x: Apenas quem requisitou esta música ou alguém com o cargo DJ a pode pular!');
            }else skip(false); 
        }
    }
}