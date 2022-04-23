import Command from '../../structures/Command';
import Client from '../../structures/Client';
import CommandContext from '../../structures/CommandContext';

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

    const data = this.client.guildCache.get(ctx.guild.id);

    if (!ctx.args.length) {
      if (!data?.djRole) {
        ctx.sendMessage({ content: `:x: Nenhum cargo de DJ setado. **Usa:** \`${data?.prefix || 'db.'}djrole <Cargo>\` para setar um cargo de DJ.`, flags: 1 << 6 });
        return;
      }

      const djrole = ctx.guild.roles.get(data.djRole);

      if (!djrole) {
        data.djRole = '';
        const dbData = await this.client.guildDB.findOne({ guildID: ctx.guild.id });

        if (dbData) {
          dbData.djrole = '';
          dbData.save();
          ctx.sendMessage({ content: `:x: Nenhum cargo de DJ setado. **Usa:** \`${data?.prefix || 'db.'}djrole <Cargo>\` para setar um cargo de DJ.`, flags: 1 << 6 });
        }
        return;
      }

      ctx.sendMessage(`<a:disco:803678643661832233> Cargo de DJ atual: \`${djrole.name}\`\n**Usa:** \`${data.prefix || 'db.'}djrole <Cargo> (0 para desativar)\``);
      return;
    }

    if (!ctx.member?.permissions.has('manageRoles') && ctx.author.id !== '334054158879686657') {
      ctx.sendMessage({ content: ':x: Precisas da permissão `Gerenciar Cargos` para usar este comando.', flags: 1 << 6 });
      return;
    }

    if (ctx.args[0] === '0') {
      if (data && data.djRole) {
        data.djRole = '';

        const dbData = await this.client.guildDB.findOne({ guildID: ctx.guild.id });

        if (dbData) {
          dbData.djrole = '';
          dbData.save();
          ctx.sendMessage(`<a:disco:803678643661832233> Cargo de DJ desativado. **Usa:** \`${data?.prefix || 'db.'}djrole <Cargo>\` para setar um novo cargo de DJ.`);
        }
        return;
      }
      ctx.sendMessage({ content: ':x: O DJ role não estava ativo!', flags: 1 << 6 });
      return;
    }

    const role = ctx.targetRoles?.[0] ?? this.client.utils.findRole(ctx.args.join(' '), ctx.guild);

    if (!role) {
      ctx.sendMessage({ content: ':x: Cargo não encontrado!', flags: 1 << 6 });
      return;
    }

    if (data) data.djRole = role.id;

    const dbData = await this.client.guildDB.findOne({ guildID: ctx.guild.id });

    if (dbData) {
      dbData.djrole = role.id;
      dbData.save();
    } else {
      await this.client.guildDB.create({
        guildID: ctx.guild.id,
        djrole: role.id
      });
    }
    ctx.sendMessage(`<a:disco:803678643661832233> Cargo \`${role.name}\` setado como DJ role`);
  }
}