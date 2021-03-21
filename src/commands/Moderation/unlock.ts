import Command from '../../structures/Command';
import Client from '../../structures/Client';

import { Message } from 'eris';

export default class Unlock extends Command {
    constructor(client: Client) {
        super(client, {
            name: 'unlock',
            description: 'Permite o envio de mensagens do cargo @everyone no canal em que o comando foi executado',
            category: 'Moderation',
            cooldown: 4,
            aliases: ['unlockchat', 'unlockchannel'],
            usage: '[motivo]'
        });
    }

    async execute(message: Message, args: Array<string>): Promise<void> {
        if (message.channel.type !== 0) return;

        const channel = message.channel;

        if (!channel.permissionsOf(message.author.id).has('manageChannels')) {
            message.channel.createMessage(':x: Não tens permissão para alterar as permissões deste canal.');
            return;
        }

        if (!channel.permissionsOf(this.client.user.id).has('manageChannels')) {
            message.channel.createMessage(':x: Não tenho permissão para alterar as permissões deste canal!');
            return;
        }

        const permissions = channel.permissionOverwrites.get(message.guildID as string);

        if (!permissions || (permissions.deny & (1 << 11)) != 1 << 11) {
            message.channel.createMessage(':x: O canal já está desbloqueado!');
            return;
        }

        const allow = permissions.allow;
        const deny = permissions.deny;

        await channel.editPermission(message.guildID as string, allow | (1 << 11), deny & ~(1 << 11), 'role', 'Lock cmd' || args.join(' ').slice(0, 50));

        message.channel.createMessage(':unlock: Canal desbloqueado!');
    }
}