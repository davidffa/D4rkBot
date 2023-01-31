import Command from '../../structures/Command';
import Client from '../../structures/Client';
import CommandContext from '../../structures/CommandContext';
import { dynamicAvatar } from '../../utils/dynamicAvatar';

export default class Enable extends Command {
  constructor(client: Client) {
    super(client, {
      name: 'enable',
      description: 'Ativa um comando no servidor.',
      category: 'Settings',
      aliases: ['enablecmd', 'enablecommand', 'ativar', 'ativarcmd', 'ativarcomando'],
      usage: '<Comando>',
      cooldown: 3,
      args: 1
    });
  }

  async execute(ctx: CommandContext): Promise<void> {
    if (ctx.channel.type !== 0) return;
    if (!ctx.member?.permissions.has('MANAGE_GUILD') && ctx.author.id !== '334054158879686657') {
      ctx.sendMessage({ content: ':x: Precisas da permissão `MANAGE_GUILD` para usar este comando.', flags: 1 << 6 });
      return;
    }

    const command = this.client.commands.filter(c => ctx.author.id === '334054158879686657' || c.category !== 'Dev').find(c => c.name === ctx.args[0] || c.aliases?.includes(ctx.args[0]));

    if (!command) {
      ctx.sendMessage({ content: ':x: Eu não tenho esse comando!', flags: 1 << 6 });
      return;
    }

    const guildData = this.client.guildCache.get(ctx.guild.id);

    if (guildData) {
      if (!guildData.disabledCmds.includes(command.name)) {
        ctx.sendMessage(`:warning: O comando \`${ctx.args[0]}\` já está ativado!`);
        return;
      }

      guildData.disabledCmds.splice(guildData.disabledCmds.indexOf(command.name), 1);
    }

    const guildDBData = await this.client.guildDB.findOne({ guildID: ctx.guild.id });

    if (guildDBData && guildDBData.disabledCmds) {
      guildDBData.disabledCmds.splice(guildDBData.disabledCmds.indexOf(command.name), 1);
      guildDBData.save();
    }

    if (!ctx.channel.permissionsOf(this.client.user.id).has('EMBED_LINKS')) {
      ctx.sendMessage(`<:on:764478511875751937> O comando \`${ctx.args[0]}\` foi ativado com sucesso!`);
      return;
    }

    const embed = new this.client.embed()
      .setColor('RANDOM')
      .setDescription(`<:on:764478511875751937> O comando \`${ctx.args[0]}\` foi ativado com sucesso!`)
      .setTimestamp()
      .setFooter(`${ctx.author.username}#${ctx.author.discriminator}`, dynamicAvatar(ctx.author));

    ctx.sendMessage({ embeds: [embed] });
  }
}