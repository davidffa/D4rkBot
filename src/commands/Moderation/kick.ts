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
    if (ctx.channel.type !== 0 || !ctx.member || !ctx.guild) return;

    if (!ctx.member.permissions.has('kickMembers')) {
      ctx.sendMessage({ content: ':x: Não tens permissão para expulsar membros.', flags: 1 << 6 });
      return;
    }

    if (!ctx.guild.members.get(this.client.user.id)?.permissions.has('kickMembers')) {
      ctx.sendMessage({ content: ':x: Não tenho permissão para expulsar membros!', flags: 1 << 6 });
      return;
    }

    const user = await this.client.utils.findUser(ctx.args.join(' '), ctx.guild);

    if (!user) {
      ctx.sendMessage({ content: ':x: Utilizador inválido!', flags: 1 << 6 });
      return;
    }

    const member = ctx.guild.members.get(user.id);

    if (!member) {
      ctx.sendMessage({ content: ':x: Membro inválido!', flags: 1 << 6 });
      return;
    }

    if (member.id === this.client.user.id) {
      ctx.sendMessage({ content: ':x: Não me consigo expulsar a mim mesmo!', flags: 1 << 6 });
      return;
    }

    if (member.id === ctx.guild.ownerID) {
      ctx.sendMessage({ content: ':x: Não consigo expulsar o dono do servidor!', flags: 1 << 6 });
      return;
    }

    const guild = ctx.guild;

    let botHighestRole = ctx.guild.roles.get(ctx.guild.id) as Role;
    let memberHighestRole = ctx.guild.roles.get(ctx.guild.id) as Role;
    let targetHighestRole = ctx.guild.roles.get(ctx.guild.id) as Role;

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
      ctx.sendMessage({ content: ':x: O cargo mais alto desse membro é superior ao meu cargo mais alto!', flags: 1 << 6 });
      return;
    }

    if (ctx.author.id !== ctx.guild.ownerID) {
      ctx.member.roles.forEach(roleID => {
        const role = guild.roles.get(roleID);
        if (!role) return;
        if (!memberHighestRole || role.position > memberHighestRole.position) {
          memberHighestRole = role;
        }
      });

      if (memberHighestRole.position <= targetHighestRole.position) {
        ctx.sendMessage({ content: ':x: O cargo mais alto desse membro é superior ao teu cargo mais alto!', flags: 1 << 6 });
        return;
      }
    }

    const reason = ctx.args.slice(1).join(' ') || 'Sem motivo';

    ctx.guild.kickMember(user.id, reason).then(() => {
      if (!member) return;
      ctx.sendMessage(`<a:verificado:803678585008816198> Expulsas-te o \`${user.username}#${user.discriminator}\` por \`${reason}\``);
    }).catch(() => {
      ctx.sendMessage({ content: ':x: Não tenho permissão para expulsar esse membro!', flags: 1 << 6 });
    });
  }
}