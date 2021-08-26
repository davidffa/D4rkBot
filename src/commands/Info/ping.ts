import Command from '../../structures/Command';
import Client from '../../structures/Client';
import CommandContext from '../../structures/CommandContext';

export default class Ping extends Command {
  constructor(client: Client) {
    super(client, {
      name: 'ping',
      description: 'Mostra o ping de envio de mensagens, o da API e o da Base de dados',
      category: 'Info',
      aliases: ['latencia', 'latency'],
      dm: true,
      cooldown: 4
    });
  }

  async execute(ctx: CommandContext) {
    const startDB = process.hrtime();
    await this.client.botDB.findOne({ botID: this.client.user.id });
    const stopDB = process.hrtime(startDB);

    const restPing = this.client.requestHandler.latencyRef.latency;
    const pingDB = Math.round(((stopDB[0] * 1e9) + stopDB[1]) / 1e6);
    const WSPing = this.client.shards.get(0)?.latency ?? 0;
    const lavalinkUSAPing = await this.client.music.nodes.get('USA Node')!.ping();
    const lavalinkEuPing = await this.client.music.nodes.get('Europe Node')!.ping();

    const res = [
      `:incoming_envelope: \`${restPing}ms\``,
      `:heartbeat: \`${Math.round(WSPing)}ms\``,
      `<:MongoDB:773610222602158090> \`${pingDB}ms\``,
      `<:lavalink:829751857483350058> \`${lavalinkUSAPing}ms\` & \`${lavalinkEuPing}ms\``
    ];

    const avgPing = (restPing + WSPing + pingDB) / 3;
    const color = avgPing < 150 ? 0x2ecc71 : avgPing < 300 ? 0xffff00 : 0xe74c3c;

    const embed = new this.client.embed()
      .setTitle('🏓 Pong')
      .setColor(color)
      .setDescription(res.join('\n'))
      .setFooter(`${ctx.author.username}#${ctx.author.discriminator}`, ctx.author.dynamicAvatarURL())
      .setTimestamp();

    if (ctx.channel.type === 0) {
      if (ctx.channel.permissionsOf(this.client.user.id).has('embedLinks')) {
        ctx.sendMessage({ embed });
      } else {
        ctx.sendMessage(res.join('\n'));
      }
    } else ctx.sendMessage({ embed })
  }
}