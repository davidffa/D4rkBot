import Command from '../../structures/Command';
import Client from '../../structures/Client';

import { Message } from 'eris';

export default class Bassboost extends Command {
    constructor(client: Client) {
        super(client, {
            name: 'bassboost',
            description: 'Aumenta os graves da música',
            category: 'Music',
            aliases: ['bb', 'bass', 'grave'],
            cooldown: 5,
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

        const bassboost = (): void => {
            if (player.bands[0] === 0) {
                player.setEQ(
                    { band: 0, gain: 0.15 },
                    { band: 1, gain: 0.17 },
                    { band: 2, gain: 0.15 }
                );

                message.channel.createMessage('<a:verificado:803678585008816198> Bassboost ativado!');
            } else {
                player.clearEQ();
                message.channel.createMessage('<a:verificado:803678585008816198> Bassboost desativado!');
            }
        }

        const isDJ = await this.client.music.hasDJRole(member);
        if (message.channel.guild.dbCache.djRole) {
            if (isDJ || message.author === player.queue.current?.requester || voiceChannel.voiceMembers.filter(m => !m.bot).length === 1) {
                bassboost();
                return;
            }
            message.channel.createMessage(':x: Apenas quem requisitou esta música ou alguém com o cargo DJ a pode ativar o bassboost!');
        } else bassboost();

    }
}