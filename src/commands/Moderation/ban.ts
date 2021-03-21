import Command from '../../structures/Command';
import Client from '../../structures/Client';

import { Message, Role } from 'eris';

export default class Ban extends Command {
    constructor(client: Client) {
        super(client, {
            name: 'ban',
            description: 'Bane alguém do servidor',
            category: 'Moderation',
            aliases: ['av'],
            usage: '<@User/ID> [motivo]',
            args: 1,
            cooldown: 3
        });
    }

    async execute(message: Message, args: Array<string>): Promise<void> {
        if (message.channel.type !== 0 || !message.member) return;

        if (!message.member.permissions.has('banMembers')) {
            message.channel.createMessage(':x: Não tens permissão para banir membros.');
            return;
        }

        if (!message.channel.guild.members.get(this.client.user.id)?.permissions.has('banMembers')) {
            message.channel.createMessage(':x: Não tenho permissão para banir membros!');
            return;
        }

        let user = message.mentions[0];

        if (!user) {
            if (Number(args[0]) && (args[0].length >= 17 || args[0].length <= 19)) {
                try {
                    user = this.client.users.get(args[0]) || await this.client.getRESTUser(args[0]);
                }catch {}
            }
        }

        if (!user) {
            message.channel.createMessage(':x: Utilizador inválido!');
            return;
        }

        const member = message.channel.guild.members.get(user.id);

        if (member) {
            if (member.id === this.client.user.id) {
                message.channel.createMessage(':x: Não me consigo banir a mim mesmo!');
                return;
            }

            if (member.id === message.channel.guild.ownerID) {
                message.channel.createMessage(':x: Não consigo banir o dono do servidor!');
                return;
            }

            const guild = message.channel.guild;

            let botHighestRole = message.channel.guild.roles.get(message.guildID as string) as Role;
            let memberHighestRole = message.channel.guild.roles.get(message.guildID as string) as Role;
            let targetHighestRole = message.channel.guild.roles.get(message.guildID as string) as Role;

            member.roles.forEach(roleID => {
                const role = guild.roles.get(roleID);
                if (!role) return;
                if (!targetHighestRole || role.position > targetHighestRole.position) {
                    targetHighestRole = role;
                }
            });

            message.channel.guild.members.get(this.client.user.id)?.roles.forEach(roleID => {
                const role = guild.roles.get(roleID);
                if (!role) return;
                if (!botHighestRole || role.position > botHighestRole.position) {
                    botHighestRole = role;
                }
            });

            if (botHighestRole.position <= targetHighestRole.position) {
                message.channel.createMessage(':x: O cargo mais alto desse membro é superior ao meu cargo mais alto!');
                return;
            }

            if (message.author.id !== message.channel.guild.ownerID) {
                message.member.roles.forEach(roleID => {
                    const role = guild.roles.get(roleID);
                    if (!role) return;
                    if (!memberHighestRole || role.position > memberHighestRole.position) {
                        memberHighestRole = role;
                    }
                });
    
                if (memberHighestRole.position <= targetHighestRole.position) {
                    message.channel.createMessage(':x: O cargo mais alto desse membro é superior ao teu cargo mais alto!');
                    return;
                }
            }
        }

        const reason = args.slice(1).join(' ') || 'Sem motivo';

        message.channel.guild.banMember(user.id, 0, reason).then(() => {
            message.channel.createMessage(`<a:verificado:803678585008816198> Banis-te o \`${user.username}#${user.discriminator}\` por \`${reason}\``);
        }).catch(() => {
            message.channel.createMessage(':x: Não tenho permissão para banir esse membro!');
        })
    }
}