import Command from '../../structures/Command';
import Client from '../../structures/Client';
import CommandContext from '../../structures/CommandContext';

export default class Setprefix extends Command {
  constructor(client: Client) {
    super(client, {
      name: 'setprefix',
      description: 'Muda o meu prefixo no servidor.',
      category: 'Settings',
      aliases: ['prefix', 'prefixo', 'setarprefixo', 'setprefixo'],
      usage: '<Prefixo>',
      cooldown: 5,
      args: 1
    });
  }

  async execute(ctx: CommandContext): Promise<void> {
    if (ctx.channel.type !== 0) return;
    if (!ctx.msg.member?.permissions.has('manageGuild') && ctx.author.id !== '334054158879686657') {
      ctx.sendMessage(':x: Precisas da permissão `Gerenciar Servidor` para usar este comando.');
      return;
    }

    if (ctx.args[0].length > 5) {
      ctx.sendMessage(':x: O meu prefixo não pode ultrapassar os 5 caracteres.');
      return;
    }

    const guildData = this.client.guildCache.get(ctx.msg.guildID as string);

    if (guildData) guildData.prefix = ctx.args[0].trim();

    const guildDBData = await this.client.guildDB.findOne({ guildID: ctx.msg.guildID });

    if (guildDBData) {
      guildDBData.prefix = ctx.args[0].trim();
      await guildDBData.save();
    } else {
      await this.client.guildDB.create({
        guildID: ctx.msg.guildID,
        prefix: ctx.args[0].trim()
      });
    }

    ctx.sendMessage(`<a:verificado:803678585008816198> Alteras-te o meu prefixo para \`${ctx.args[0].trim()}\``);
  }
}