import Command from '../../structures/Command';
import Client from '../../structures/Client';

import { Message } from 'eris';

export default class Disable extends Command {
    constructor(client: Client) {
        super(client, {
            name: 'disable',
            description: 'Desativa um comando no servidor',
            category: 'Settings',
            aliases: ['disablecmd', 'disablecommand', 'desativar', 'desativarcmd', 'desativarcomando'],
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

        if (command.name === 'help') {
            message.channel.createMessage(':x: Não podes desativar o comando de ajuda!');
            return;
        }else if (['ping', 'enable', 'disable', 'botinfo', 'invite'].includes(command.name)) {
            message.channel.createMessage(`:x: Não podes desativar o comando \`${args[0]}\``);
            return;
        }

        const guildData = message.channel.guild.dbCache;

        if (guildData) {
            if (guildData.disabledCmds.includes(command.name)) {
                message.channel.createMessage(`:warning: O comando \`${args[0]}\` já está desativado!`);
                return;
            }

            guildData.disabledCmds.push(command.name);
        }

        const guildDBData = await this.client.guildDB.findOne({ guildID: message.guildID });

        if (guildDBData) {
            guildDBData.disabledCmds ? guildDBData.disabledCmds.push(command.name) : guildDBData.disabledCmds = [command.name];
            guildDBData.save();
        }else {
            this.client.guildDB.create({
                guildID: message.guildID,
                disabledCmds: [command.name]
            });
        }

        if (!message.channel.permissionsOf(this.client.user.id).has('embedLinks')) {
            message.channel.createMessage(`<:off:764478504124416040> O comando \`${args[0]}\` foi desativado com sucesso!`);
            return;
        }

        const embed = new this.client.embed()
            .setColor('RANDOM')
            .setDescription(`<:off:764478504124416040> O comando \`${args[0]}\` foi desativado com sucesso!`)
            .setTimestamp()
            .setFooter(`${message.author.username}#${message.author.discriminator}`, message.author.dynamicAvatarURL());

        message.channel.createMessage({ embed });
    }
}