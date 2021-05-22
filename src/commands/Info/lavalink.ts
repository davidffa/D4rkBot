import Command from '../../structures/Command';
import Client from '../../structures/Client';
import CommandContext from '../../structures/CommandContext';

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

  execute(ctx: CommandContext): void {
    const node = this.client.music.nodes.first();

    if (!node) {
      ctx.sendMessage(':warning: Não existem nodes do lavalink disponíveis.');
      return;
    }

    if (ctx.channel.type === 0 && !ctx.channel.permissionsOf(this.client.user.id).has('embedLinks')) {
      ctx.sendMessage(':x: Preciso da permissão `Anexar Links` para executar este comando');
      return;
    }

    const embed = new this.client.embed()
      .setColor('RANDOM')
      .setTitle('Status do Node do LavaLink')
      .addField(':id: Nome', `\`${node.options.identifier}\``, true)
      .addField(':calendar: Players a tocar', `\`${node.stats.players}\``, true)
      .addField('<a:infinity:838759634361253929> Uptime', `\`${this.client.utils.msToDate(node.stats.uptime)}\``, true)
      .addField('<a:carregando:488783607352131585> CPU', `Cores: \`${node.stats.cpu.cores}\`\nLavalink: \`${~~(node.stats.cpu.lavalinkLoad * 100)}%\`\nSistema: \`${~~(node.stats.cpu.systemLoad * 100)}%\``, true)
      .addField('<:ram:751468688686841986> RAM', `\`${(node.stats.memory.used / 1024 / 1024).toFixed(0)}MB\``, true)
      .addField(':ping_pong: Ping', `\`${this.client.music.heartbeats.get(node.options.identifier as string)?.ping || 0}ms\``, true)
      .setTimestamp()
      .setFooter(`${ctx.author.username}#${ctx.author.discriminator}`, ctx.author.dynamicAvatarURL());

      ctx.sendMessage({ embed });
  }
}