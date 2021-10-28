import Command from '../../structures/Command';
import Client from '../../structures/Client';
import CommandContext from '../../structures/CommandContext';

export default class PlayerStats extends Command {
  constructor(client: Client) {
    super(client, {
      name: 'playerstats',
      description: 'Mostra informações do player de música.',
      category: 'Info',
      aliases: ['musicplayerstats'],
      cooldown: 4
    });
  }

  async execute(ctx: CommandContext) {
    if (ctx.channel.type !== 0) return;

    const player = this.client.music.players.get(ctx.guild.id);

    if (!player) {
      ctx.sendMessage({ content: ':x: Não estou a tocar nada de momento!', flags: 1 << 6 });
      return;
    }

    const node = player.node;

    async function getPlayerPing() {
      return new Promise((res) => {
        const cb = (payload: any) => {
          node.manager.removeListener('nodeRaw', cb);

          if (payload.op == 'playerPing') {
            res(payload.ping);
          }
        };

        node.manager.on('nodeRaw', cb);

        node.send({
          op: 'playerPing',
          guildId: player?.guild,
        });
      })
    }

    const ping = await getPlayerPing();
    const nodePing = await node.ping();

    const embed = new this.client.embed()
      .setTitle('Status do player')
      .setColor('RANDOM')
      .addField(':microphone2: Conectado ao servidor de voz', `\`${player.voiceState.event.endpoint}\``)
      .addField('<:lavalink:829751857483350058> Conectado ao lavalink', `\`${node.options.identifier}\``)
      .addField('🏓 Pings', `Lavalink <-> servidor de voz: \`${ping}ms\`\nBot <-> Lavalink: \`${nodePing}ms\``)
      .setFooter(`${ctx.author.username}#${ctx.author.discriminator}`, ctx.author.dynamicAvatarURL())
      .setTimestamp();

    ctx.sendMessage({ embeds: [embed] });
  }
}