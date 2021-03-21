import Command from '../../structures/Command';
import Client from '../../structures/Client';

import { Message } from 'eris';

export default class Djrole extends Command {
    constructor(client: Client) {
        super(client, {
            name: 'djrole',
            description: 'Seta o cargo de DJ',
            category: 'Settings',
            aliases: ['dj', 'cargodj'],
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

        const data = this.client.guildCache.get(message.guildID as string);

        if (!args.length) {
            if (!data?.djRole) {
                message.channel.createMessage(`:x: Nenhum cargo de DJ setado. **Usa:** \`${data?.prefix || 'db.'}djrole <Cargo>\` para setar um cargo de DJ.`);
                return;
            }

            const djrole = message.channel.guild.roles.get(data.djRole);

            if (!djrole) {
                data.djRole = '';
                const dbData = await this.client.guildDB.findOne({ guildID: message.guildID as string });
                
                if (dbData) {
                    dbData.djrole = '';
                    dbData.save();
                    message.channel.createMessage(`:x: Nenhum cargo de DJ setado. **Usa:** \`${data?.prefix || 'db.'}djrole <Cargo>\` para setar um cargo de DJ.`);
                }
                return;
            }

            message.channel.createMessage(`<a:disco:803678643661832233> Cargo de DJ atual: \`${djrole.name}\`\n**Usa:** \`${data.prefix || 'db.'}djrole <Cargo> (0 para desativar)\``);
            return;
        }

        if (args[0] === '0') {
            if (data && data.djRole) {
                data.djRole = '';

                const dbData = await this.client.guildDB.findOne({ guildID: message.guildID as string });
                
                if (dbData) {
                    dbData.djrole = '';
                    dbData.save();
                    message.channel.createMessage(`<a:disco:803678643661832233> Cargo de DJ desativado. **Usa:** \`${data?.prefix || 'db.'}djrole <Cargo>\` para setar um novo cargo de DJ.`);
                }
                return;
            }
            message.channel.createMessage(':x: O DJ role não estava ativo!');
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

        if (data) data.djRole = role.id;

        const dbData = await this.client.guildDB.findOne({ guildID: message.guildID as string });
                
        if (dbData) {
            dbData.djrole = role.id;
            dbData.save();
        }else {
            await this.client.guildDB.create({
                guildID: message.guildID as string,
                djrole: role.id
            });
        }
        message.channel.createMessage(`<a:disco:803678643661832233> Cargo \`${role.name}\` setado como DJ role`);
    }
}