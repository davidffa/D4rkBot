import Command from '../../structures/Command';
import Client from '../../structures/Client';
import CommandContext from '../../structures/CommandContext';
import { ReactionCollector } from '../../structures/Collector';

import { Emoji, Message, User } from 'eris';

export default class Queue extends Command {
  constructor(client: Client) {
    super(client, {
      name: 'queue',
      description: 'Vê as músicas que estão na queue.',
      category: 'Music',
      aliases: ['q'],
      cooldown: 6,
    });
  }

  async execute(ctx: CommandContext): Promise<void> {
    if (ctx.channel.type !== 0) return;
    if (!ctx.channel.permissionsOf(this.client.user.id).has('embedLinks')) {
      ctx.sendMessage({ content: ':x: Preciso da permissão `Anexar Links` para executar este comando', flags: 1 << 6 });
      return;
    }

    const player = this.client.music.players.get(ctx.guild.id);

    if (!player) {
      ctx.sendMessage({ content: ':x: Não estou a tocar nada de momento!', flags: 1 << 6 });
      return;
    }

    if (player.radio) {
      ctx.sendMessage(`:radio: A tocar a rádio ${player.radio}`);
      return;
    }

    const queue = player.queue;

    const getSongDetails = (pos: number, pos2: number): string => {
      const data = [];

      for (; pos <= pos2 && queue[pos]; pos++) {
        const req = queue[pos].requester as User;
        data.push(`${pos + 1}º - \`${queue[pos].title}\` (Requisitado por \`${req.username}#${req.discriminator}\`)`)
      }
      return data.join('\n');
    }

    let page = 1;
    const pages = Math.ceil(queue.size / 10);

    const req = queue.current?.requester as User;

    const desc = [
      `<a:disco:803678643661832233> **A tocar:** \`${queue.current?.title}\` (Requisitado por \`${req.username}#${req.discriminator}\`)\n`,
      `:alarm_clock: Tempo total da queue (${this.client.utils.msToHour(queue.duration)}) ----- Total de músicas na queue: ${queue.size}`,
      `${getSongDetails(0, 9)}`
    ];

    const embed = new this.client.embed()
      .setColor('RANDOM')
      .setTitle(':bookmark_tabs: Lista de músicas')
      .setDescription(desc.join('\n'))
      .setTimestamp()
      .setFooter(`Página ${page} de ${pages}`, ctx.author.dynamicAvatarURL());

    const msg = await ctx.sendMessage({ embeds: [embed] }, true) as Message;

    if (queue.size <= 10) return;

    msg.addReaction('⬅️');
    msg.addReaction('➡️');


    const filter = (r: Emoji, user: User) => (r.name === '⬅️' || r.name === '➡️') && user === ctx.author;

    const collector = new ReactionCollector(this.client, msg, filter, { time: 10 * 60 * 1000 });

    collector.on('collect', r => {
      if (ctx.channel.type !== 0) return;

      const newDesc = [
        `<a:disco:803678643661832233> **A tocar:** \`${queue.current?.title}\` (Requisitado por \`${req.username}#${req.discriminator}\`)`,
        `:alarm_clock: Tempo total da queue (${this.client.utils.msToHour(queue.duration)}) ----- Total de músicas na queue: ${queue.size}`,
        `${getSongDetails(0, 9)}`
      ];

      switch (r.name) {
        case '⬅️':
          if (page === 1) return;
          page--;
          if (page === 1) {
            embed.setDescription(newDesc.join('\n'));
          } else {
            embed.setDescription(getSongDetails((page - 1) * 9 + 1, page * 10))
              .setFooter(`Página ${page} de ${pages}`, ctx.author.dynamicAvatarURL());
          }

          msg.edit({ embeds: [embed] });

          if (ctx.channel.permissionsOf(this.client.user.id).has('manageMessages')) {
            msg.removeReaction(r.name, ctx.author.id);
          }
          break;
        case '➡️':
          if (page === pages) return;
          page++;
          embed.setDescription(getSongDetails((page - 1) * 9 + 1, page * 10))
            .setFooter(`Página ${page} de ${pages}`, ctx.author.dynamicAvatarURL());

          msg.edit({ embeds: [embed] });

          if (ctx.channel.permissionsOf(this.client.user.id).has('manageMessages')) {
            msg.removeReaction(r.name, ctx.author.id);
          }
          break;
      }
    })
  }
}