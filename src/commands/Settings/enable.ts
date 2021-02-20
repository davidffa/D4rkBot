import Command from '../../structures/Command';
import Client from '../../structures/Client';

import { Message } from 'eris';

class Enable extends Command {
    constructor(client: Client) {
        super(client, {
            name: 'enable',
            description: 'Ativa um comando no servidor',
            category: 'Settings',
            aliases: ['enablecmd', 'enablecommand', 'ativar', 'ativarcmd', 'ativarcomando'],
            usage: '<Comando>',
            cooldown: 3,
            args: 1
        });
    }

    async execute(message: Message, args: Array<string>): Promise<void> {
        if (message.channel.type !== 0) return;
        if (!message.member?.permissions.has('manageGuild') && message.author.id !== '334054158879686657') {
            message.channel.createMessage(':x: Precisas da permissão `MANAGE_GUILD` para usar este comando.');
            return;
        }

        const command = this.client.commands.filter(c => message.author.id === '334054158879686657' || c.category !== 'Dev').find(c => c.name === args[0] || c.aliases?.includes(args[0]));

        if (!command) {
            message.channel.createMessage(':x: Eu não tenho esse comando!');
            return;
        }

        const guildData = this.client.guildCache.get(message.guildID as string);

        if (guildData) {
            if (!guildData.disabledCmds.includes(command.name)) {
                message.channel.createMessage(`:warning: O comando \`${args[0]}\` já está ativado!`);
                return;
            }

            guildData.disabledCmds.splice(guildData.disabledCmds.indexOf(command.name), 1);
        }

        const guildDBData = await this.client.guildDB.findOne({ guildID: message.guildID });

        if (guildDBData && guildDBData.disabledCmds) {
            guildDBData.disabledCmds.splice(guildDBData.disabledCmds.indexOf(command.name), 1);
            guildDBData.save();
        }

        if (!message.channel.permissionsOf(this.client.user.id).has('embedLinks')) {
            message.channel.createMessage(`<:on:764478511875751937> O comando \`${args[0]}\` foi ativado com sucesso!`);
            return;
        }

        const embed = new this.client.embed()
            .setColor('RANDOM')
            .setDescription(`<:on:764478511875751937> O comando \`${args[0]}\` foi ativado com sucesso!`)
            .setTimestamp()
            .setFooter(`${message.author.username}#${message.author.discriminator}`, message.author.dynamicAvatarURL());

        message.channel.createMessage({ embed });
    }
}

module.exports = Enable;