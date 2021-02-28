import Command from '../../structures/Command';
import Client from '../../structures/Client';

import { Message } from 'eris';

export default class Seek extends Command {
    constructor(client: Client) {
        super(client, {
            name: 'seek',
            description: 'Avança para um tempo específico da música',
            category: 'Music',
            cooldown: 5,
            args: 1,
            usage: '<Tempo>'
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

        const seek = (time: string): void => {
            if (Number(time) !== 0 && !Number(time.replace(/:/g, ''))) {
                message.channel.createMessage(':x: Tempo inválido! Tente no formato `ss` ou `hh:mm:ss`');
                return;
            }     
            
            if (!player.queue.current?.duration) {
                message.channel.createMessage(':x: Não consegui ver o tempo da música.');
                return;
            }

            let finalTime = 0;
    
            if (time.includes(':')) {
                const parts = time.split(':');
    
                if (parts.length > 3) {
                    message.channel.createMessage(`:x: O tempo tem de variar entre \`0 e ${player.queue.current.duration / 1000}\` segundos`)
                    return;
                }
     
                const len = parts.length
                for (let i = 0; i < len; i++) {
                    finalTime += Number(parts.pop()) * Math.pow(60, i);
                }
            }

            if ((finalTime && (finalTime < 0 || finalTime * 1000 > player.queue.current.duration)) || Number(time) < 0 || Number(time) * 1000 > player.queue.current.duration) {
                message.channel.createMessage(`:x: O tempo tem de variar entre \`0 e ${player.queue.current.duration / 1000}\` segundos`)
                return;
            }

            player.seek(finalTime && (finalTime * 1000) || Number(time) * 1000);
            message.channel.createMessage(`:fast_forward: Tempo da música setado para \`${args[0]}\`.`);
        }

        const isDJ = await this.client.music.hasDJRole(member);

        if (this.client.guildCache.get(message.guildID as string)?.djRole) {
            if (isDJ || message.author === player.queue.current?.requester || voiceChannel.voiceMembers.filter(m => !m.bot).length === 1) {
                seek(args[0]);
                return;
            }
            message.channel.createMessage(':x: Apenas quem requisitou esta música ou alguém com o cargo DJ !');
        } else seek(args[0]);
    }
}