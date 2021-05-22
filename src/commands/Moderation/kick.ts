import Command from '../../structures/Command';
import Client from '../../structures/Client';

import { Message, Role } from 'eris';

export default class Kick extends Command {
  constructor(client: Client) {
    super(client, {
      name: 'kick',
      description: 'Expulsa alguém do servidor.',
      category: 'Moderation',
      aliases: ['av'],
      usage: '<@User/ID> [motivo]',
      args: 1,
      cooldown: 3
    });
  }

  async execute(message: Message, args: Array<string>): Promise<void> {
    if (message.channel.type !== 0 || !message.member) return;

    if (!message.member.permissions.has('kickMembers')) {
      message.channel.createMessage(':x: Não tens permissão para expulsar membros.');
      return;
    }

    if (!message.channel.guild.members.get(this.client.user.id)?.permissions.has('kickMembers')) {
      message.channel.createMessage(':x: Não tenho permissão para expulsar membros!');
      return;
    }

    let member = message.channel.guild.members.get(message.mentions[0]?.id) || message.channel.guild.members.get(args[0]);

    if (!member) {
      message.channel.createMessage(':x: Utilizador inválido!');
      return;
    }

    if (member) {
      if (member.id === this.client.user.id) {
        message.channel.createMessage(':x: Não me consigo expulsar a mim mesmo!');
        return;
      }

      if (member.id === message.channel.guild.ownerID) {
        message.channel.createMessage(':x: Não consigo expulsar o dono do servidor!');
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

    message.channel.guild.kickMember(member.id, reason).then(() => {
      if (!member) return;
      message.channel.createMessage(`<a:verificado:803678585008816198> Expulsas-te o \`${member.user.username}#${member.user.discriminator}\` por \`${reason}\``);
    }).catch(() => {
      message.channel.createMessage(':x: Não tenho permissão para expulsar esse membro!');
    });
  }
}