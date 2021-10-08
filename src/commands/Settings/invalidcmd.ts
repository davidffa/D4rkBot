import Command from '../../structures/Command';
import Client from '../../structures/Client';
import CommandContext from '../../structures/CommandContext';

export default class InvalidCmd extends Command {
  constructor(client: Client) {
    super(client, {
      name: 'invalidcmd',
      description: 'Ativa ou desativa a mensagem de comando inválido.',
      category: 'Settings',
      aliases: ['invalidcommand', 'didumean'],
      usage: '<on/off>',
      cooldown: 5,
      args: 1
    });
  }

  async execute(ctx: CommandContext): Promise<void> {
    if (ctx.channel.type !== 0 || !ctx.guild) return;
    if (!ctx.member?.permissions.has('manageGuild') && ctx.author.id !== '334054158879686657') {
      ctx.sendMessage({ content: ':x: Precisas da permissão `Gerenciar Servidor` para usar este comando.', flags: 1 << 6 });
      return;
    }

    const data = this.client.guildCache.get(ctx.guild.id);

    if (ctx.args[0].toLowerCase() === 'on') {
      data!.didUMean = true;

      const guildDBData = await this.client.guildDB.findOne({ guildID: ctx.guild.id });

      if (guildDBData) {
        guildDBData.didumean = true;
        guildDBData.save();
      } else {
        this.client.guildDB.create({
          guildID: ctx.guild.id,
          didumean: true
        });
      }
      ctx.sendMessage('<a:verificado:803678585008816198> Mensagem de comando inválido ativada!');
    } else if (ctx.args[0].toLowerCase() === 'off') {
      data!.didUMean = false;

      const guildDBData = await this.client.guildDB.findOne({ guildID: ctx.guild.id });

      if (guildDBData) {
        guildDBData.didumean = false;
        guildDBData.save();
      } else {
        this.client.guildDB.create({
          guildID: ctx.guild.id,
          didumean: false
        });
      }

      ctx.sendMessage('<a:verificado:803678585008816198> Mensagem de comando inválido desativada!');
    } else {
      ctx.sendMessage({ content: `:x: **Usa:** \`${this.client.guildCache.get(ctx.guild.id)?.prefix}invalidcmd <on/off>\``, flags: 1 << 6 });
    }
  }
}