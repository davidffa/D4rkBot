import Command from '../../structures/Command';
import Client from '../../structures/Client';

import { Message } from 'eris';

export default class Lock extends Command {
    constructor(client: Client) {
        super(client, {
            name: 'lock',
            description: 'Proibe o envio de mensagens do cargo @everyone no canal em que o comando foi executado',
            category: 'Moderation',
            cooldown: 4,
            aliases: ['lockchat', 'lockchannel'],
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

        if (!permissions || (permissions.deny & (1 << 11)) == 1 << 11) {
            message.channel.createMessage(':x: O canal já está bloqueado!');
            return;
        }

        const allow = permissions.allow;
        const deny = permissions.deny;

        await message.channel.createMessage(':lock: Canal bloqueado!');
        channel.editPermission(message.guildID as string, (allow & (1 << 11)) == 1 << 11 ? allow - (1 << 11) : allow, deny + (1 << 11), 'role', 'Lock cmd' || args.join(' ').slice(0, 50));   
    }
}