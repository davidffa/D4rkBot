import Command from '../../structures/Command';
import Client from '../../structures/Client';
import CommandContext from '../../structures/CommandContext';

import { Message } from 'eris';

export default class Autorole extends Command {
  constructor(client: Client) {
    super(client, {
      name: 'autorole',
      description: 'Seta o cargo que os novos membros do servidor irão receber.',
      category: 'Settings',
      usage: '[Cargo/0]',
      cooldown: 5,
    });
  }

  async execute(ctx: CommandContext): Promise<void> {
    if (ctx.channel.type !== 0 || !ctx.guild) return;
    if (!ctx.msg.member?.permissions.has('manageRoles') && ctx.author.id !== '334054158879686657') {
      ctx.sendMessage(':x: Precisas da permissão `Gerenciar Cargos` para usar este comando.');
      return;
    }

    const data = this.client.guildCache.get(ctx.msg.guildID as string);

    if (!ctx.args.length) {
      if (!data?.autoRole) {
        ctx.sendMessage(`:x: Nenhum cargo para autorole setado. **Usa:** \`${data?.prefix || 'db.'}autorole <Cargo>\` para setar o cargo.`);
        return;
      }

      const role = ctx.guild.roles.get(data.autoRole);

      if (!role) {
        data.autoRole = '';
        const dbData = await this.client.guildDB.findOne({ guildID: ctx.msg.guildID as string });

        if (dbData) {
          dbData.roleID = '';
          dbData.save();
          ctx.sendMessage(`:x: Nenhum cargo para autorole setado. **Usa:** \`${data?.prefix || 'db.'}autorole <Cargo>\` para setar o cargo.`);
        }
        return;
      }

      ctx.sendMessage(`Cargo do autorole: \`${role.name}\`\n**Usa:** \`${data.prefix || 'db.'}autorole <Cargo> (0 para desativar)\``);
      return;
    }

    if (ctx.args[0] === '0') {
      if (data && data.autoRole) {
        data.autoRole = '';

        const dbData = await this.client.guildDB.findOne({ guildID: ctx.msg.guildID as string });

        if (dbData) {
          dbData.roleID = '';
          dbData.save();
          ctx.sendMessage(`<a:verificado:803678585008816198> Autorole desativado. **Usa:** \`${data?.prefix || 'db.'}autorole <Cargo>\` para setar um novo cargo.`);
        }
        return;
      }
      ctx.sendMessage(':x: O autorole não estava ativo!');
      return;
    }

    const role = ctx.guild.roles.get((ctx.msg instanceof Message && ctx.msg.roleMentions[0]) || ctx.args[0])
      || ctx.guild.roles.find(r => r.name === ctx.args[0])
      || ctx.guild.roles.find(r => r.name.toLowerCase().includes(ctx.args.join(' ').toLowerCase()));

    if (!role) {
      ctx.sendMessage(':x: Cargo não encontrado!');
      return;
    }

    if (data) data.autoRole = role.id;

    const dbData = await this.client.guildDB.findOne({ guildID: ctx.msg.guildID as string });

    if (dbData) {
      dbData.roleID = role.id;
      dbData.save();
    } else {
      await this.client.guildDB.create({
        guildID: ctx.msg.guildID as string,
        roleID: role.id
      });
    }

    let botHighestRole = ctx.guild.roles.get(ctx.guild.id);

    ctx.guild.members.get(this.client.user.id)?.roles.forEach(roleID => {
      const r = ctx.guild?.roles.get(roleID);
      if (!r) return;
      if (!botHighestRole || r.position > botHighestRole.position) {
        botHighestRole = r;
      }
    });

    ctx.sendMessage(`<a:verificado:803678585008816198> Cargo \`${role.name}\` setado como cargo de autorole.${ctx.channel.permissionsOf(this.client.user.id).has('manageRoles') ? '' : '\n:warning: Não tenho permissão para alterar cargos no servidor!'}${(botHighestRole && botHighestRole.position <= role.position) ? '\n:warning: Esse cargo está numa posição superior ao meu cargo mais alto!' : ''}`);
  }
}