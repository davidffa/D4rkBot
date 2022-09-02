import Command from '../../structures/Command';
import Client from '../../structures/Client';
import CommandContext from '../../structures/CommandContext';

export default class Logs extends Command {
  constructor(client: Client) {
    super(client, {
      name: 'logs',
      description: 'Configura os canais onde irei enviar as logs (mensagem bem-vindo etc).',
      category: 'Settings',
      aliases: ['setlogs', 'configlogs'],
      cooldown: 5,
    });
  }

  async execute(ctx: CommandContext): Promise<void> {
    if (ctx.channel.type !== 0 || !ctx.guild) return;

    if (!ctx.channel.permissionsOf(ctx.author.id).has('manageMessages') && ctx.author.id !== '334054158879686657') {
      ctx.sendMessage({ content: ':x: Precisas da permissão `Gerenciar Mensagens` para usar este comando!', flags: 1 << 6 });
      return;
    }

    const guildData = this.client.guildCache.get(ctx.guild.id);

    if (!guildData) return;

    if (ctx.args[0].toLowerCase() === 'welcome') {
      const channel = ctx.targetChannels?.[0] ?? ctx.guild.channels.get(ctx.args[1]);

      if (!ctx.targetChannels?.[0] && !ctx.guild.channels.get(ctx.args[1])) {
        guildData.welcomeChatID = '';
        await this.client.guildDB.updateOne({
          guildID: ctx.guild.id
        }, {
          $unset: { welcomeChatID: '' }
        });

        ctx.sendMessage('<a:verificado:803678585008816198> Logs de bem-vindo desativadas!');
        return;
      }

      if (!channel) {
        ctx.sendMessage(':x: Canal não encontrado');
        return;
      }

      guildData.welcomeChatID = channel.id;

      await this.client.guildDB.updateOne({
        guildID: ctx.guild.id
      }, {
        $set: { welcomeChatID: '' }
      }, {
        upsert: true
      });

      ctx.sendMessage(`<a:verificado:803678585008816198> Canal de bem-vindo setado para \`${channel.name}\`.`);
    } else if (ctx.args[0].toLowerCase() === 'leave') {
      const channel = ctx.targetChannels?.[0] ?? ctx.guild.channels.get(ctx.args[1]);

      if (!ctx.targetChannels?.[0] && !ctx.guild.channels.get(ctx.args[1])) {
        guildData.memberRemoveChatID = '';
        await this.client.guildDB.updateOne({
          guildID: ctx.guild.id
        }, {
          $unset: { memberRemoveChatID: '' }
        });

        ctx.sendMessage('<a:verificado:803678585008816198> Logs de saída desativadas!');
        return;
      }

      if (!channel) {
        ctx.sendMessage(':x: Canal não encontrado');
        return;
      }

      guildData.memberRemoveChatID = channel.id;

      await this.client.guildDB.updateOne({
        guildID: ctx.guild.id
      }, {
        $set: { memberRemoveChatID: '' }
      }, {
        upsert: true
      });

      ctx.sendMessage(`<a:verificado:803678585008816198> Canal de mensagens de saída setado para \`${channel.name}\`.`);
    } else {
      ctx.sendMessage(`:x: **Usa:** <@${this.client.user.id}> logs <welcome/leave> [#canal]`);
    }
  }
}