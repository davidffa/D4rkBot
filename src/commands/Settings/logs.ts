import Command from '../../structures/Command';
import Client from '../../structures/Client';
import CommandContext from '../../structures/CommandContext';
import { ReactionCollector, MessageCollector } from '../../structures/Collector';

import { Message, Emoji, User } from 'eris';

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
      ctx.sendMessage(':x: Precisas da permissão `Gerenciar Mensagens` para usar este comando!');
      return;
    }

    if (!ctx.channel.permissionsOf(this.client.user.id).has('addReactions')) {
      ctx.sendMessage(':x: Preciso da permissão `Adicionar Reações` para executar este comando');
      return;
    }

    if (!ctx.channel.permissionsOf(this.client.user.id).has('embedLinks')) {
      ctx.sendMessage(':x: Preciso da permissão `Inserir Links` para executar este comando');
      return;
    }

    const guildData = this.client.guildCache.get(ctx.msg.guildID as string);
    const welcomeChannel = ctx.guild.channels.get(guildData?.welcomeChatID || '');
    const byeChannel = ctx.guild.channels.get(guildData?.memberRemoveChatID || '');

    const embed = new this.client.embed()
      .setColor('RANDOM')
      .setTitle('Configurar logs')
      .setDescription(`:one: Canal das mensagens de bem-vindo: \`${welcomeChannel ? `${welcomeChannel.name}` : 'Nenhum'}\`\n\n:two: Canal das mensagens de saídas de membros: \`${byeChannel ? `${byeChannel.name}` : 'Nenhum'}\``)
      .setTimestamp()
      .setFooter(`${ctx.author.username}#${ctx.author.discriminator}`, ctx.author.dynamicAvatarURL());

    await ctx.sendMessage({ embed });
    ctx.sentMsg.addReaction('1⃣');
    ctx.sentMsg.addReaction('2⃣');

    const welcomeMsgCollector = (): void => {
      const filter = (m: Message) => m.author.id === ctx.author.id;
      const collector = new MessageCollector(this.client, ctx.channel, filter, { max: 1, time: 20000 });

      collector.on('collect', async (m) => {
        if (m.channel.type !== 0) return;
        ctx.sentMsg.delete().catch(() => { });

        if (!guildData) return;

        if (m.content === '0') {
          guildData.welcomeChatID = '';

          const guildDBData = await this.client.guildDB.findOne({ guildID: m.guildID });

          if (guildDBData) {
            guildDBData.welcomeChatID = '';
            guildDBData.save();
          }

          ctx.sendMessage('<a:verificado:803678585008816198> Logs de bem-vindo desativadas!');
          return;
        }

        const channel = m.channel.guild.channels.get(m.channelMentions[0])
          || m.channel.guild.channels.get(m.content)
          || m.channel.guild.channels.find(ch => ch.name === m.content)
          || m.channel.guild.channels.find(ch => ch.name.toLowerCase().includes(m.content.toLowerCase()));

        if (!channel) {
          m.channel.createMessage(':x: Canal não encontrado');
          return;
        }

        guildData.welcomeChatID = channel.id;

        const guildDBData = await this.client.guildDB.findOne({ guildID: m.guildID });

        if (guildDBData) {
          guildDBData.welcomeChatID = channel.id;
          guildDBData.save();
        } else {
          this.client.guildDB.create({
            guildID: ctx.msg.guildID,
            welcomeChatID: channel.id
          });
        }

        ctx.sendMessage(`<a:verificado:803678585008816198> Canal de bem-vindo setado para \`${channel.name}\`.`);
      });
    }

    const byeMsgCollector = (): void => {
      const filter = (m: Message) => m.author.id === ctx.author.id;
      const collector = new MessageCollector(this.client, ctx.channel, filter, { max: 1, time: 20000 });

      collector.on('collect', async (m) => {
        if (m.channel.type !== 0) return;
        ctx.sentMsg.delete().catch(() => { });
        if (!guildData) return;

        if (m.content === '0') {
          guildData.memberRemoveChatID = '';

          const guildDBData = await this.client.guildDB.findOne({ guildID: m.guildID });

          if (guildDBData) {
            guildDBData.memberRemoveChatID = '';
            guildDBData.save();
          }

          ctx.sendMessage('<a:verificado:803678585008816198> Logs de bem-vindo desativadas!');
          return;
        }

        const channel = m.channel.guild.channels.get(m.channelMentions[0])
          || m.channel.guild.channels.get(m.content)
          || m.channel.guild.channels.find(ch => ch.name === m.content)
          || m.channel.guild.channels.find(ch => ch.name.toLowerCase().includes(m.content.toLowerCase()));

        if (!channel) {
          m.channel.createMessage(':x: Canal não encontrado');
          return;
        }

        guildData.memberRemoveChatID = channel.id;

        const guildDBData = await this.client.guildDB.findOne({ guildID: m.guildID });

        if (guildDBData) {
          guildDBData.memberRemoveChatID = channel.id;
          guildDBData.save();
        } else {
          this.client.guildDB.create({
            guildID: ctx.msg.guildID,
            memberRemoveChatID: channel.id
          });
        }

        ctx.sendMessage(`<a:verificado:803678585008816198> Canal de saídas de membros setado para \`${channel.name}\`.`);
      });
    }

    const filter = (r: Emoji, user: User) => (r.name === '1⃣' || r.name === '2⃣') && user === ctx.author;
    const collector = new ReactionCollector(this.client, ctx.sentMsg, filter, { max: 1, time: 3 * 60 * 1000 });

    collector.on('collect', async r => {
      switch (r.name) {
        case '1⃣':
          ctx.sendMessage('Escreva o ID ou o nome do canal para onde as mensagens de bem-vindo irão (Escreva 0 para desativar).');
          welcomeMsgCollector();
          break;
        case '2⃣':
          ctx.sendMessage('Escreva o ID ou o nome do canal para onde as mensagens de saída de membros irão (Escreva 0 para desativar).');
          byeMsgCollector();
          break;
      }

    });

    collector.on('end', () => {
      ctx.sentMsg.removeReaction('1⃣');
      ctx.sentMsg.removeReaction('2⃣');
    });
  }
}