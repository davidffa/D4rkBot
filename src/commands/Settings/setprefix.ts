import Command from '../../structures/Command';
import Client from '../../structures/Client';

import { Message } from 'eris';

export default class Setprefix extends Command {
    constructor(client: Client) {
        super(client, {
            name: 'setprefix',
            description: 'Muda o meu prefixo no servidor',
            category: 'Settings',
            aliases: ['prefix', 'prefixo', 'setarprefixo', 'setprefixo'],
            usage: '<Prefixo>',
            cooldown: 5,
            args: 1
        });
    }

    async execute(message: Message, args: Array<string>): Promise<void> {
        if (message.channel.type !== 0) return;
        if (!message.member?.permissions.has('manageGuild') && message.author.id !== '334054158879686657') {
            message.channel.createMessage(':x: Precisas da permissão `MANAGE_GUILD` para usar este comando.');
            return;
        }

        if (args[0].length > 5) {
            message.channel.createMessage(':x: O meu prefixo não pode ultrapassar os 5 caracteres.');
            return;
        }

        const guildData = message.channel.guild.dbCache;

        if (guildData) guildData.prefix = args[0].trim();

        const guildDBData = await this.client.guildDB.findOne({ guildID: message.guildID });

        if (guildDBData) {
            guildDBData.prefix = args[0].trim();
            await guildDBData.save();
        }else {
            await this.client.guildDB.create({ 
                guildID: message.guildID,
                prefix: args[0].trim()
            });
        }

        message.channel.createMessage(`<a:verificado:803678585008816198> Alteras-te o meu prefixo para \`${args[0].trim()}\``);
    }
}