import Command from '../../structures/Command';
import Client from '../../structures/Client';
import CommandContext from '../../structures/CommandContext';

export default class Disable extends Command {
  constructor(client: Client) {
    super(client, {
      name: 'disable',
      description: 'Desativa um comando no servidor.',
      category: 'Settings',
      aliases: ['disablecmd', 'disablecommand', 'desativar', 'desativarcmd', 'desativarcomando'],
      usage: '<Comando>',
      cooldown: 3,
      args: 1
    });
  }

  async execute(ctx: CommandContext): Promise<void> {
    if (ctx.channel.type !== 0) return;
    if (!ctx.msg.member?.permissions.has('manageGuild') && ctx.author.id !== '334054158879686657') {
      ctx.sendMessage(':x: Precisas da permissão `MANAGE_GUILD` para usar este comando.');
      return;
    }

    const command = this.client.commands.filter(c => ctx.author.id === '334054158879686657' || c.category !== 'Dev').find(c => c.name === ctx.args[0] || c.aliases?.includes(ctx.args[0]));

    if (!command) {
      ctx.sendMessage(':x: Eu não tenho esse comando!');
      return;
    }

    if (command.name === 'help') {
      ctx.sendMessage(':x: Não podes desativar o comando de ajuda!');
      return;
    } else if (['ping', 'enable', 'disable', 'botinfo', 'invite'].includes(command.name)) {
      ctx.sendMessage(`:x: Não podes desativar o comando \`${ctx.args[0]}\``);
      return;
    }

    const guildData = this.client.guildCache.get(ctx.msg.guildID as string);

    if (guildData) {
      if (guildData.disabledCmds.includes(command.name)) {
        ctx.sendMessage(`:warning: O comando \`${ctx.args[0]}\` já está desativado!`);
        return;
      }

      guildData.disabledCmds.push(command.name);
    }

    const guildDBData = await this.client.guildDB.findOne({ guildID: ctx.msg.guildID });

    if (guildDBData) {
      guildDBData.disabledCmds ? guildDBData.disabledCmds.push(command.name) : guildDBData.disabledCmds = [command.name];
      guildDBData.save();
    } else {
      this.client.guildDB.create({
        guildID: ctx.msg.guildID,
        disabledCmds: [command.name]
      });
    }

    if (!ctx.channel.permissionsOf(this.client.user.id).has('embedLinks')) {
      ctx.sendMessage(`<:off:764478504124416040> O comando \`${ctx.args[0]}\` foi desativado com sucesso!`);
      return;
    }

    const embed = new this.client.embed()
      .setColor('RANDOM')
      .setDescription(`<:off:764478504124416040> O comando \`${ctx.args[0]}\` foi desativado com sucesso!`)
      .setTimestamp()
      .setFooter(`${ctx.author.username}#${ctx.author.discriminator}`, ctx.author.dynamicAvatarURL());

    ctx.sendMessage({ embed });
  }
}