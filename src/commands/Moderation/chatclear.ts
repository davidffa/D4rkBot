import Command from '../../structures/Command';
import Client from '../../structures/Client';

import { Message } from 'eris';

export default class Chatclear extends Command {
    constructor(client: Client) {
        super(client, {
            name: 'chatclear',
            description: 'Limpa mensagens num canal de texto',
            category: 'Moderation',
            cooldown: 4,
            usage: '<Número de mensagens>',
            aliases: ['cc', 'limparchat', 'purge', 'clear'],
            args: 1
        });
    }

    async execute(message: Message, args: Array<string>): Promise<void> {
        if (message.channel.type !== 0) return;

        const channel = message.channel;

        if (!channel.permissionsOf(message.author.id).has('manageMessages')) {
            message.channel.createMessage(':x: Não tens permissão para apagar mensagens.');
            return;
        }

        if (!channel.permissionsOf(this.client.user.id).has('manageMessages')) {
            message.channel.createMessage(':x: Não tenho permissão para apagar mensagens!');
            return;
        }

        if (!parseInt(args[0])) {
            message.channel.createMessage(':x: Número inválido!');
            return;
        }

        channel.purge(parseInt(args[0]) + 1).then(async msgs => {
            if (parseInt(args[0]) + 1 !== msgs) {
                const msg = await message.channel.createMessage(`<a:verificado:803678585008816198> Limpas \`${msgs-1}\` mensagens\n:warning: Não consegui apagar todas as \`${parseInt(args[0])}\` mensagens`);
                setTimeout(() => {
                    msg.delete().catch(() => { });
                }, 7e3);
                return;
            }

            const msg = await message.channel.createMessage(`<a:verificado:803678585008816198> Limpas \`${msgs-1}\` mensagens`);
            setTimeout(() => {
                msg.delete().catch(() => {});
            }, 7e3);
        });
    }
}