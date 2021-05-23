import Command from '../../structures/Command';
import Client from '../../structures/Client';
import CommandContext from '../../structures/CommandContext';

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

  async execute(ctx: CommandContext): Promise<void> {
    if (ctx.channel.type !== 0 || !ctx.msg.member || !ctx.guild) return;

    if (!ctx.msg.member.permissions.has('kickMembers')) {
      ctx.sendMessage(':x: Não tens permissão para expulsar membros.');
      return;
    }

    if (!ctx.guild.members.get(this.client.user.id)?.permissions.has('kickMembers')) {
      ctx.sendMessage(':x: Não tenho permissão para expulsar membros!');
      return;
    }

    let member = ctx.guild.members.get((ctx.msg instanceof Message && ctx.msg.mentions[0]?.id) || ctx.args[0]);

    if (!member) {
      ctx.sendMessage(':x: Utilizador inválido!');
      return;
    }

    if (member) {
      if (member.id === this.client.user.id) {
        ctx.sendMessage(':x: Não me consigo expulsar a mim mesmo!');
        return;
      }

      if (member.id === ctx.guild.ownerID) {
        ctx.sendMessage(':x: Não consigo expulsar o dono do servidor!');
        return;
      }

      const guild = ctx.guild;

      let botHighestRole = ctx.guild.roles.get(ctx.msg.guildID as string) as Role;
      let memberHighestRole = ctx.guild.roles.get(ctx.msg.guildID as string) as Role;
      let targetHighestRole = ctx.guild.roles.get(ctx.msg.guildID as string) as Role;

      member.roles.forEach(roleID => {
        const role = guild.roles.get(roleID);
        if (!role) return;
        if (!targetHighestRole || role.position > targetHighestRole.position) {
          targetHighestRole = role;
        }
      });

      ctx.guild.members.get(this.client.user.id)?.roles.forEach(roleID => {
        const role = guild.roles.get(roleID);
        if (!role) return;
        if (!botHighestRole || role.position > botHighestRole.position) {
          botHighestRole = role;
        }
      });

      if (botHighestRole.position <= targetHighestRole.position) {
        ctx.sendMessage(':x: O cargo mais alto desse membro é superior ao meu cargo mais alto!');
        return;
      }

      if (ctx.author.id !== ctx.guild.ownerID) {
        ctx.msg.member.roles.forEach(roleID => {
          const role = guild.roles.get(roleID);
          if (!role) return;
          if (!memberHighestRole || role.position > memberHighestRole.position) {
            memberHighestRole = role;
          }
        });

        if (memberHighestRole.position <= targetHighestRole.position) {
          ctx.sendMessage(':x: O cargo mais alto desse membro é superior ao teu cargo mais alto!');
          return;
        }
      }
    }

    const reason = ctx.args.slice(1).join(' ') || 'Sem motivo';

    ctx.guild.kickMember(member.id, reason).then(() => {
      if (!member) return;
      ctx.sendMessage(`<a:verificado:803678585008816198> Expulsas-te o \`${member.user.username}#${member.user.discriminator}\` por \`${reason}\``);
    }).catch(() => {
      ctx.sendMessage(':x: Não tenho permissão para expulsar esse membro!');
    });
  }
}