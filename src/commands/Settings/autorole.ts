import Command from '../../structures/Command';
import Client from '../../structures/Client';

import { Message } from 'eris';

export default class Autorole extends Command {
    constructor(client: Client) {
        super(client, {
            name: 'autorole',
            description: 'Seta o cargo que os novos membros do servidor irão receber',
            category: 'Settings',
            usage: '[Cargo/0]',
            cooldown: 5,
        });
    }

    async execute(message: Message, args: Array<string>): Promise<void> {
        if (message.channel.type !== 0) return;
        if (!message.member?.permissions.has('manageRoles') && message.author.id !== '334054158879686657') {
            message.channel.createMessage(':x: Precisas da permissão `MANAGE_ROLES` para usar este comando.');
            return;
        }

        const data = message.channel.guild.dbCache;

        if (!args.length) {
            if (!data?.autoRole) {
                message.channel.createMessage(`:x: Nenhum cargo para autorole setado. **Usa:** \`${data?.prefix || 'db.'}autorole <Cargo>\` para setar o cargo.`);
                return;
            }

            const role = message.channel.guild.roles.get(data.autoRole);

            if (!role) {
                data.autoRole = '';
                const dbData = await this.client.guildDB.findOne({ guildID: message.guildID as string });
                
                if (dbData) {
                    dbData.roleID = '';
                    dbData.save();
                    message.channel.createMessage(`:x: Nenhum cargo para autorole setado. **Usa:** \`${data?.prefix || 'db.'}autorole <Cargo>\` para setar o cargo.`);
                }
                return;
            }

            message.channel.createMessage(`Cargo do autorole: \`${role.name}\`\n**Usa:** \`${data.prefix || 'db.'}autorole <Cargo> (0 para desativar)\``);
            return;
        }

        if (args[0] === '0') {
            if (data && data.autoRole) {
                data.autoRole = '';

                const dbData = await this.client.guildDB.findOne({ guildID: message.guildID as string });
                
                if (dbData) {
                    dbData.roleID = '';
                    dbData.save();
                    message.channel.createMessage(`<a:verificado:803678585008816198> Autorole desativado. **Usa:** \`${data?.prefix || 'db.'}autorole <Cargo>\` para setar um novo cargo.`);
                }
                return;
            }
            message.channel.createMessage(':x: O autorole não estava ativo!');
            return;
        }

        const role = message.channel.guild.roles.get(message.roleMentions[0])
            || message.channel.guild.roles.get(args[0])
            || message.channel.guild.roles.find(r => r.name === args[0])
            || message.channel.guild.roles.find(r => r.name.toLowerCase().includes(args.join(' ').toLowerCase()));

        if (!role) {
            message.channel.createMessage(':x: Cargo não encontrado!');
            return;
        }

        if (data) data.autoRole = role.id;

        const dbData = await this.client.guildDB.findOne({ guildID: message.guildID as string });
                
        if (dbData) {
            dbData.roleID = role.id;
            dbData.save();
        }else {
            await this.client.guildDB.create({
                guildID: message.guildID as string,
                roleID: role.id
            });
        }

        message.channel.createMessage(`<a:verificado:803678585008816198> Cargo \`${role.name}\` setado como cargo de autorole.${message.channel.permissionsOf(this.client.user.id).has('manageRoles') ? '' : ':warning: Não tenho permissão para alterar cargos no servidor!'}`);
    }
}