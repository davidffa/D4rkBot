import Command from '../../structures/Command';
import Client from '../../structures/Client';

import { Message } from 'eris';

export default class Remove extends Command {
    constructor(client: Client) {
        super(client, {
            name: 'remove',
            description: 'Remove uma música da queue',
            category: 'Music',
            aliases: ['r'],
            usage: '<Posição>',
            cooldown: 4,
            args: 1
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

        const remove = (pos: number): void => {
            if (!player.queue.length) {
                message.channel.createMessage(':x: Não há músicas na queue');
                return;
            } 

            if (!pos || pos <= 0 || pos > player.queue.length) {
                message.channel.createMessage(`:x: Número inválido! Tente um número entre 1 e ${player.queue.length}`);
                return;
            }

            player.queue.remove(pos-1);
            message.channel.createMessage(`<a:disco:803678643661832233> Música na posição ${pos} removida!`);
        }

        const isDJ = await this.client.music.hasDJRole(member);

        if (message.channel.guild.dbCache.djRole) {
            if (isDJ || (player.queue[parseInt(args[0])-1] && message.author === player.queue[parseInt(args[0])-1].requester) || voiceChannel.voiceMembers.filter(m => !m.bot).length === 1) {
                remove(parseInt(args[0]));
                return;
            }
            message.channel.createMessage(':x: Apenas quem requisitou essa música ou alguém com o cargo DJ pode remover a música da queue!');
        } else remove(parseInt(args[0]));
    }
}