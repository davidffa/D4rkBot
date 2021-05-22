import Command from '../../structures/Command';
import Client from '../../structures/Client';
import CommandContext from '../../structures/CommandContext';

import { Message } from 'eris';

export default class Djrole extends Command {
  constructor(client: Client) {
    super(client, {
      name: 'djrole',
      description: 'Seta o cargo de DJ.',
      category: 'Settings',
      aliases: ['dj', 'cargodj'],
      usage: '[Cargo/0]',
      cooldown: 5,
    });
  }

  async execute(ctx: CommandContext): Promise<void> {
    if (ctx.channel.type !== 0 || !ctx.guild) return;

    const data = this.client.guildCache.get(ctx.msg.guildID as string);

    if (!ctx.args.length) {
      if (!data?.djRole) {
        ctx.sendMessage(`:x: Nenhum cargo de DJ setado. **Usa:** \`${data?.prefix || 'db.'}djrole <Cargo>\` para setar um cargo de DJ.`);
        return;
      }

      const djrole = ctx.guild.roles.get(data.djRole);

      if (!djrole) {
        data.djRole = '';
        const dbData = await this.client.guildDB.findOne({ guildID: ctx.msg.guildID as string });

        if (dbData) {
          dbData.djrole = '';
          dbData.save();
          ctx.sendMessage(`:x: Nenhum cargo de DJ setado. **Usa:** \`${data?.prefix || 'db.'}djrole <Cargo>\` para setar um cargo de DJ.`);
        }
        return;
      }

      ctx.sendMessage(`<a:disco:803678643661832233> Cargo de DJ atual: \`${djrole.name}\`\n**Usa:** \`${data.prefix || 'db.'}djrole <Cargo> (0 para desativar)\``);
      return;
    }

    if (!ctx.msg.member?.permissions.has('manageRoles') && ctx.author.id !== '334054158879686657') {
      ctx.sendMessage(':x: Precisas da permissão `Gerenciar Cargos` para usar este comando.');
      return;
    }

    if (ctx.args[0] === '0') {
      if (data && data.djRole) {
        data.djRole = '';

        const dbData = await this.client.guildDB.findOne({ guildID: ctx.msg.guildID as string });

        if (dbData) {
          dbData.djrole = '';
          dbData.save();
          ctx.sendMessage(`<a:disco:803678643661832233> Cargo de DJ desativado. **Usa:** \`${data?.prefix || 'db.'}djrole <Cargo>\` para setar um novo cargo de DJ.`);
        }
        return;
      }
      ctx.sendMessage(':x: O DJ role não estava ativo!');
      return;
    }

    const role = ctx.guild.roles.get((ctx.msg instanceof Message && ctx.msg.roleMentions[0]) || ctx.args[0])
      || ctx.guild.roles.find(r => r.name === ctx.args[0])
      || ctx.guild.roles.find(r => r.name.toLowerCase().includes(ctx.args.join(' ').toLowerCase()));

    if (!role) {
      ctx.sendMessage(':x: Cargo não encontrado!');
      return;
    }

    if (data) data.djRole = role.id;

    const dbData = await this.client.guildDB.findOne({ guildID: ctx.msg.guildID });

    if (dbData) {
      dbData.djrole = role.id;
      dbData.save();
    } else {
      await this.client.guildDB.create({
        guildID: ctx.msg.guildID as string,
        djrole: role.id
      });
    }
    ctx.sendMessage(`<a:disco:803678643661832233> Cargo \`${role.name}\` setado como DJ role`);
  }
}