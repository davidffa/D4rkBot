import Command from '../../structures/Command';
import Client from '../../structures/Client';
import CommandContext from '../../structures/CommandContext';
import Embed from '../../structures/Embed';

import { Node } from 'vulkava';
import { User } from 'oceanic.js';
import { dynamicAvatar } from '../../utils/dynamicAvatar';

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
    const node = this.client.music.nodes.find(n => n.identifier === 'USA Node')

    if (!node) {
      ctx.sendMessage(':warning: Não existem nodes do lavalink disponíveis.');
      return;
    }

    if (ctx.channel.type === 0 && !ctx.channel.permissionsOf(this.client.user.id).has('EMBED_LINKS')) {
      ctx.sendMessage({ content: ':x: Preciso da permissão `Anexar Links` para executar este comando', flags: 1 << 6 });
      return;
    }

    const embed = await this.getNodeInfoEmbed(ctx.author, node);

    ctx.sendMessage({ embeds: [embed] });
  }

  async getNodeInfoEmbed(author: User, node: Node): Promise<Embed> {
    const lavalinkPing = await node.ping();
    const versions = node.versions;

    return new this.client.embed()
      .setColor('RANDOM')
      .setTitle('<:lavalink:829751857483350058> Status do Node do Lavalink')
      .setDescription('[Lavalink que eu uso](https://github.com/davidffa/lavalink/releases)\nWrapper do Lavalink: [Vulkava](https://npmjs.com/package/vulkava)')
      .addField(':id: Nome', `\`${node.identifier}\``, true)
      .addField(':calendar: Players a tocar', `\`${node.stats.players}\``, true)
      .addField('<a:infinity:838759634361253929> Uptime', `\`${this.client.utils.msToDate(node.stats.uptime)}\``, true)
      .addField('<a:carregando:869622946233221160> CPU', `Cores: \`${node.stats.cpu.cores}\`\nLavalink: \`${~~(node.stats.cpu.lavalinkLoad * 100)}%\`\nSistema: \`${~~(node.stats.cpu.systemLoad * 100)}%\``, true)
      .addField('<:ram:751468688686841986> RAM', `\`${(node.stats.memory.used / 1024 / 1024).toFixed(0)}MB\``, true)
      .addField(':ping_pong: Ping', `\`${lavalinkPing}ms\``, true)
      .addField(':information_source: Versões', `Lavaplayer: \`${versions!.LAVAPLAYER}\`\nBuild: \`${versions!.BUILD}\`\nBuild em: <t:${Math.floor(versions!.BUILDTIME / 1000)}:d>`, true)
      .addField('\u200B', `<:spring:869617355498610708> \`${versions!.SPRING}\`\n<:kotlin:856168010004037702> \`${versions!.KOTLIN}\`\n<:java:869621849045229608> \`${versions!.JVM}\``, true)
      .setTimestamp()
      .setFooter(`${author.username}#${author.discriminator}`, dynamicAvatar(author));
  }
}