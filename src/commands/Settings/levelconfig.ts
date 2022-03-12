import Command from '../../structures/Command';
import Client from '../../structures/Client';
import CommandContext from '../../structures/CommandContext';

export default class LevelConfig extends Command {
  constructor(client: Client) {
    super(client, {
      name: 'levelconfig',
      description: 'Configura o sistema de níveis.',
      category: 'Settings',
      aliases: ['levelcfg'],
      usage: '<on/off/reset> [membro para resetar (default = todos)]',
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

    const data = this.client.guildCache.get(ctx.guild.id)!;

    if (ctx.args[0] === 'on') {
      if (data.levelEnabled) {
        ctx.sendMessage({ content: ':x: O sistema de níveis já está ativado!', flags: 1 << 6 });
        return;
      }

      data.levelEnabled = true;
      await this.client.guildDB.updateOne({ guildID: ctx.guild.id }, { $set: { levelEnabled: true } }, { upsert: true });
      ctx.sendMessage(':white_check_mark: O sistema de níveis foi ativado com sucesso!\n_Nenhum conteúdo das mensagens será salvo neste sistema._');
    } else if (ctx.args[0] === 'off') {
      if (!data.levelEnabled) {
        ctx.sendMessage({ content: ':x: O sistema de níveis já está desativado!', flags: 1 << 6 });
        return;
      }

      data.levelEnabled = false;
      await this.client.guildDB.updateOne({ guildID: ctx.guild.id }, { $set: { levelEnabled: false } }, { upsert: true });
      ctx.sendMessage(':white_check_mark: O sistema de níveis foi desativado com sucesso!');
    } else if (ctx.args[0] === 'reset') {
      if (ctx.args[1]) {
        const user = await this.client.utils.findUser(ctx.args[1], ctx.guild);
        const member = ctx.guild.members.get(user?.id ?? '');

        if (!member) {
          ctx.sendMessage({ content: ':x: Membro não encontrado!', flags: 1 << 6 });
          return;
        }

        await this.client.levelDB.deleteOne({
          _id: member.id,
          guildID: ctx.guild.id
        });

        ctx.sendMessage(`O nível do membro \`${member.username}#${member.user.discriminator}\` foi resetado com sucesso!`);

        return;
      }

      this.client.levelDB.deleteMany({ guildID: ctx.guild.id });
    }
  }
}