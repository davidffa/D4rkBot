import Command from '../../structures/Command';
import Client from '../../structures/Client';
import CommandContext from '../../structures/CommandContext';
import { ComponentCollector, MessageCollector } from '../../structures/Collector';

import { Message, ActionRow, ActionRowComponents, ComponentInteraction } from 'eris';

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

    if (!ctx.channel.permissionsOf(this.client.user.id).has('embedLinks')) {
      ctx.sendMessage({ content: ':x: Preciso da permissão `Inserir Links` para executar este comando', flags: 1 << 6 });
      return;
    }

    const guildData = this.client.guildCache.get(ctx.guild.id);
    const welcomeChannel = ctx.guild.channels.get(guildData?.welcomeChatID || '');
    const byeChannel = ctx.guild.channels.get(guildData?.memberRemoveChatID || '');

    const embed = new this.client.embed()
      .setColor('RANDOM')
      .setTitle('Configurar logs')
      .setDescription(`👋 Canal das mensagens de bem-vindo: \`${welcomeChannel ? `${welcomeChannel.name}` : 'Nenhum'}\`\n\n🚪 Canal das mensagens de saídas de membros: \`${byeChannel ? `${byeChannel.name}` : 'Nenhum'}\``)
      .setTimestamp()
      .setFooter(`${ctx.author.username}#${ctx.author.discriminator}`, ctx.author.dynamicAvatarURL());

    const components: ActionRowComponents[] = [
      {
        custom_id: 'welcome',
        style: 2,
        type: 2,
        emoji: {
          name: '👋'
        },
      },
      {
        custom_id: 'leave',
        style: 2,
        type: 2,
        emoji: {
          name: '🚪'
        }
      }
    ]

    const row: ActionRow = {
      type: 1,
      components
    }

    const msg = await ctx.sendMessage({ embeds: [embed], components: [row] }, true) as Message;

    const welcomeMsgCollector = (): void => {
      const filter = (m: Message) => m.author.id === ctx.author.id;
      const collector = new MessageCollector(this.client, ctx.channel, filter, { max: 1, time: 20000 });

      collector.on('collect', async (m) => {
        if (m.channel.type !== 0) return;
        msg.delete().catch(() => { });

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
            guildID: ctx.guild.id,
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
        msg.delete().catch(() => { });
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
            guildID: ctx.guild.id,
            memberRemoveChatID: channel.id
          });
        }

        ctx.sendMessage(`<a:verificado:803678585008816198> Canal de saídas de membros setado para \`${channel.name}\`.`);
      });
    }

    const filter = (i: ComponentInteraction) => i.member!.id === ctx.author.id;
    const collector = new ComponentCollector(this.client, msg, filter, { max: 1, time: 3 * 60 * 1000 });

    collector.on('collect', i => {
      switch (i.data.custom_id) {
        case 'welcome':
          i.editParent({ content: 'Escreva o ID ou o nome do canal para onde as mensagens de bem-vindo irão (Escreva 0 para desativar).', embeds: [], components: [] });
          welcomeMsgCollector();
          break;
        case 'leave':
          i.editParent({ content: 'Escreva o ID ou o nome do canal para onde as mensagens de saída de membros irão (Escreva 0 para desativar).', embeds: [], components: [] });
          byeMsgCollector();
          break;
      }
    });
  }
}