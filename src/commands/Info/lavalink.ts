import Command from '../../structures/Command';
import Client from '../../structures/Client';
import CommandContext from '../../structures/CommandContext';
import Embed from '../../structures/Embed';

import { Node } from 'erela.js';
import { User, Message, ActionRowComponents, ActionRow, ComponentInteraction } from 'eris';
import { ComponentCollector } from '../../structures/Collector';

export default class Lavalink extends Command {
  constructor(client: Client) {
    super(client, {
      name: 'lavalink',
      description: 'Mostra o status do node do lavalink.',
      aliases: ['nodestats', 'lavalinkstats', 'lavalinknodestats'],
      category: 'Info',
      cooldown: 10,
    });
  }

  async execute(ctx: CommandContext): Promise<void> {
    const nodes = [
      this.client.music.nodes.get('USA Node'),
      this.client.music.nodes.get('Europe Node')
    ]

    if (!nodes.length) {
      ctx.sendMessage(':warning: Não existem nodes do lavalink disponíveis.');
      return;
    }

    if (ctx.channel.type === 0 && !ctx.channel.permissionsOf(this.client.user.id).has('embedLinks')) {
      ctx.sendMessage({ content: ':x: Preciso da permissão `Anexar Links` para executar este comando', flags: 1 << 6 });
      return;
    }

    const components: ActionRowComponents[] = [
      {
        custom_id: 'left',
        style: 2,
        type: 2,
        emoji: {
          name: '⬅️'
        },
        disabled: true
      },
      {
        custom_id: 'right',
        style: 2,
        type: 2,
        emoji: {
          name: '➡️'
        }
      }
    ]

    const row: ActionRow = {
      type: 1,
      components
    }

    const embed = await this.getNodeInfoEmbed(ctx.author, nodes[0] as Node);

    const msg = await ctx.sendMessage({ embeds: [embed], components: [row] }, true) as Message;

    let page = 1;

    const filter = (i: ComponentInteraction) => i.member!.id === ctx.author.id;
    const collector = new ComponentCollector(this.client, msg, filter, { time: 3 * 60 * 1000, max: 10 });

    collector.on('collect', async (i) => {
      switch (i.data.custom_id) {
        case 'left':
          if (page === 1) return;
          page--;
          row.components[0].disabled = true;
          row.components[1].disabled = false;
          break;
        case 'right':
          if (page === 2) return;
          page++;
          row.components[0].disabled = false;
          row.components[1].disabled = true;
          break;
      }
      const e = await this.getNodeInfoEmbed(ctx.author, nodes[page - 1] as Node);
      i.editParent({ embeds: [e], components: [row] });
    });
  }

  async getNodeInfoEmbed(author: User, node: Node): Promise<Embed> {
    const lavalinkPing = await node.ping();
    const versions = node.versions;

    return new this.client.embed()
      .setColor('RANDOM')
      .setTitle('<:lavalink:829751857483350058> Status dos Nodes do Lavalink')
      .setDescription('[Lavalink que eu uso](https://github.com/davidffa/lavalink/releases)')
      .addField(':id: Nome', `\`${node.options.identifier}\``, true)
      .addField(':calendar: Players a tocar', `\`${node.stats.players}\``, true)
      .addField('<a:infinity:838759634361253929> Uptime', `\`${this.client.utils.msToDate(node.stats.uptime)}\``, true)
      .addField('<a:carregando:869622946233221160> CPU', `Cores: \`${node.stats.cpu.cores}\`\nLavalink: \`${~~(node.stats.cpu.lavalinkLoad * 100)}%\`\nSistema: \`${~~(node.stats.cpu.systemLoad * 100)}%\``, true)
      .addField('<:ram:751468688686841986> RAM', `\`${(node.stats.memory.used / 1024 / 1024).toFixed(0)}MB\``, true)
      .addField(':ping_pong: Ping', `\`${lavalinkPing}ms\``, true)
      .addField(':information_source: Versões', `Lavaplayer: \`${versions!.LAVAPLAYER}\`\nBuild: \`${versions!.BUILD}\`\nBuild em: <t:${Math.floor(versions!.BUILDTIME / 1000)}:d>`, true)
      .addField('\u200B', `<:spring:869617355498610708> \`${versions!.SPRING}\`\n<:kotlin:856168010004037702> \`${versions!.KOTLIN}\`\n<:java:869621849045229608> \`${versions!.JVM}\``, true)
      .setTimestamp()
      .setFooter(`${author.username}#${author.discriminator}`, author.dynamicAvatarURL());
  }
}