import Command from '../../structures/Command';
import Client from '../../structures/Client';
import CommandContext from '../../structures/CommandContext';

import fetch from 'node-fetch';

interface LavalinkVersions {
  Lavaplayer: string;
  JVM: string;
  Build: string;
  BuildTime: number;
  Spring: string;
  Kotlin: string;
}

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
    const node = this.client.music.nodes.first();

    if (!node) {
      ctx.sendMessage(':warning: Não existem nodes do lavalink disponíveis.');
      return;
    }

    if (ctx.channel.type === 0 && !ctx.channel.permissionsOf(this.client.user.id).has('embedLinks')) {
      ctx.sendMessage(':x: Preciso da permissão `Anexar Links` para executar este comando');
      return;
    }

    const startLL = process.hrtime();
    const res = await fetch(`http://${process.env.LAVALINKHOST}:${process.env.LAVALINKPORT}/version`, {
      headers: { Authorization: process.env.LAVALINKPASSWORD as string }
    });
    const stopLL = process.hrtime(startLL);
    const lavalinkPing = Math.round(((stopLL[0] * 1e9) + stopLL[1]) / 1e6);

    const versions: LavalinkVersions = await res.json();

    const embed = new this.client.embed()
      .setColor('RANDOM')
      .setTitle('<:lavalink:829751857483350058> Status do Node do Lavalink')
      .setDescription('[Lavalink que eu uso](https://github.com/davidffa/lavalink/releases)')
      .addField(':id: Nome', `\`${node.options.identifier}\``, true)
      .addField(':calendar: Players a tocar', `\`${node.stats.players}\``, true)
      .addField('<a:infinity:838759634361253929> Uptime', `\`${this.client.utils.msToDate(node.stats.uptime)}\``, true)
      .addField('<a:carregando:869622946233221160> CPU', `Cores: \`${node.stats.cpu.cores}\`\nLavalink: \`${~~(node.stats.cpu.lavalinkLoad * 100)}%\`\nSistema: \`${~~(node.stats.cpu.systemLoad * 100)}%\``, true)
      .addField('<:ram:751468688686841986> RAM', `\`${(node.stats.memory.used / 1024 / 1024).toFixed(0)}MB\``, true)
      .addField(':ping_pong: Ping', `\`${lavalinkPing}ms\``, true)
      .addField(':information_source: Versões', `Lavaplayer: \`${versions.Lavaplayer}\`\nBuild: \`${versions.Build}\`\nBuild em: <t:${Math.floor(versions.BuildTime / 1000)}:d>`, true)
      .addField('\u200B', `<:spring:869617355498610708> \`${versions.Spring}\`\n<:kotlin:856168010004037702> \`${versions.Kotlin}\`\n<:java:869621849045229608> \`${versions.JVM}\``, true)      
      .addField('\u200B', '\u200B', true)
      .setTimestamp()
      .setFooter(`${ctx.author.username}#${ctx.author.discriminator}`, ctx.author.dynamicAvatarURL());

      ctx.sendMessage({ embed });
  }
}