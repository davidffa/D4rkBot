import Command from '../../structures/Command';
import Client from '../../structures/Client';
import CommandContext from '../../structures/CommandContext';

import { Effect } from '../../typings/index';

import { Emoji, User } from 'eris';
import { ReactionCollector } from '../../structures/Collector';

export default class Djtable extends Command {
  constructor(client: Client) {
    super(client, {
      name: 'djtable',
      description: 'Adiciona efeitos na música que está a tocar.',
      category: 'Music',
      aliases: ['soundeffects', 'efeitos', 'filters', 'soundfilters', 'effects', 'mesadj'],
      cooldown: 5,
    });
  }

  async execute(ctx: CommandContext): Promise<void> {
    if (ctx.channel.type !== 0) return;

    if (!ctx.channel.permissionsOf(this.client.user.id).has('embedLinks')) {
      ctx.sendMessage(':x: Preciso da permissão `Anexar Links` para executar este comando');
      return;
    }

    if (!ctx.channel.permissionsOf(this.client.user.id).has('addReactions')) {
      ctx.sendMessage(':x: Preciso da permissão `Adicionar Reações` para executar este comando');
      return;
    }

    const player = this.client.music.players.get(ctx.msg.guildID as string);

    if (!player) {
      ctx.sendMessage(':x: Não estou a tocar nada de momento!');
      return;
    }

    const voiceChannelID = ctx.msg.member?.voiceState.channelID;

    if (!voiceChannelID || (voiceChannelID && voiceChannelID !== player.voiceChannel)) {
      ctx.sendMessage(':x: Precisas de estar no meu canal de voz para usar esse comando!');
      return;
    }

    const voiceChannel = this.client.getChannel(voiceChannelID);

    if (voiceChannel.type !== 2) return;

    const member = ctx.msg.member;
    if (!member) return;

    const sendFilterMessage = async (): Promise<void> => {
      if (player.djTableMsg) {
        ctx.sendMessage(':x: Já existe uma mesa de DJ aberta!');
        return;
      }
      const effects: Effect[] = ['bass', 'pop', 'soft', 'treblebass', 'nightcore', 'vaporwave'];

      const embed = new this.client.embed()
        .setTitle('<a:disco:803678643661832233> Mesa de DJ')
        .setColor('RANDOM')
        .setDescription(`**0)** Remove todos os filtros ativos\n\n${effects.map((effect, idx) => `**${idx + 1})** ${effect.charAt(0).toUpperCase()}${effect.slice(1)} **[${player.effects.includes(effect) ? '<:on:764478511875751937>' : '<:off:764478504124416040>'}]**`).join('\n')}`)
        .setThumbnail('https://i.pinimg.com/564x/a3/a9/29/a3a929cc8d09e88815b89bc071ff4d8d.jpg')
        .setTimestamp()
        .setFooter(`${ctx.author.username}#${ctx.author.discriminator}`, ctx.author.dynamicAvatarURL());

      await ctx.sendMessage({ embed });
      player.djTableMsg = ctx.sentMsg;
      ctx.sentMsg.addReaction('1️⃣');
      ctx.sentMsg.addReaction('2️⃣');
      ctx.sentMsg.addReaction('3️⃣');
      ctx.sentMsg.addReaction('4️⃣');
      ctx.sentMsg.addReaction('5️⃣');
      ctx.sentMsg.addReaction('6️⃣');
      ctx.sentMsg.addReaction('0️⃣');
      ctx.sentMsg.addReaction('x_:751062867444498432');

      const filter = (r: Emoji, u: User) => (r.name === '0️⃣' || r.name === '1️⃣' || r.name === '2️⃣' ||
        r.name === '3️⃣' || r.name === '4️⃣' || r.name === '5️⃣' || r.name === '6️⃣' || r.id === '751062867444498432') && u === ctx.author;

      const collector = new ReactionCollector(this.client, ctx.sentMsg, filter, { max: 20, time: 90000 });

      collector.on('collect', r => {
        switch (r.name) {
          case '0️⃣':
            player.filters.clear();
            player.effects = [];
            embed.setDescription(`**0)** Remove todos os filtros ativos\n\n${effects.map((effect, idx) => `**${idx + 1})** ${effect.charAt(0).toUpperCase()}${effect.slice(1)} **[${player.effects.includes(effect) ? '<:on:764478511875751937>' : '<:off:764478504124416040>'}]**`).join('\n')}`);
            ctx.editMessage({ embed });
            break;
          case 'x_':
            collector.stop('Close');
            break;
          default:
            const i = parseInt(r.name.replace(/\uFE0F\u20E3/, ''))
            if (!player.effects.includes(effects[i - 1])) {
              player.effects.push(effects[i - 1])
            } else {
              player.effects.splice(player.effects.indexOf(effects[i - 1]));
            }

            const filters = {}
            for (const effect of player.effects) {
              Object.assign(filters, configs[effect]);
            }

            player.filters.set(filters);

            embed.setDescription(`**0)** Remove todos os filtros ativos\n\n${effects.map((effect, idx) => `**${idx + 1})** ${effect.charAt(0).toUpperCase()}${effect.slice(1)} **[${player.effects.includes(effect) ? '<:on:764478511875751937>' : '<:off:764478504124416040>'}]**`).join('\n')}`);
            ctx.editMessage({ embed });
            break;
        }
      });

      collector.on('remove', r => {
        collector.emit('collect', r, ctx.author);
      });

      collector.on('end', () => {
        delete player.djTableMsg;

        ctx.sentMsg.delete();
        ctx.channel.createMessage('<a:disco:803678643661832233> Mesa de DJ fechada!');
      });
    }

    const isDJ = await this.client.music.hasDJRole(member);
    if (this.client.guildCache.get(ctx.msg.guildID as string)?.djRole) {
      if (isDJ || ctx.author === player.queue.current?.requester || voiceChannel.voiceMembers.filter(m => !m.bot).length === 1) {
        sendFilterMessage();
        return;
      }
      ctx.channel.createMessage(':x: Apenas quem requisitou esta música ou alguém com o cargo DJ pode usar a mesa de DJ!');
    } else sendFilterMessage();
  }
}

const configs = {
  bass: {
    equalizer: [0.29, 0.23, 0.19, 0.16, 0.08],
  },
  pop: {
    equalizer: [-0.09, -0.09, -0.09, 0.02, 0.04, 0.16, 0.18, 0.22, 0.22, 0.18, 0.12, 0.02, -0.03, -0.06, -0.1],
  },
  soft: {
    equalizer: [0, 0, 0, 0, 0, 0, 0, 0, -0.25, -0.25, -0.25, -0.25, -0.25, -0.25, -0.25],
  },
  treblebass: {
    equalizer: [0.55, 0.55, 0.5, 0.15, 0.3, 0.45, 0.23, 0.35, 0.45, 0.55, 0.55, 0.5, 0.10],
  },
  nightcore: {
    equalizer: [0.3, 0.3],
    timescale: { pitch: 1.2, rate: 1.1 },
    tremolo: { depth: 0.3, frequency: 14 },
  },
  vaporwave: {
    equalizer: [0.3, 0.3],
    timescale: { pitch: 0.5 },
    tremolo: { depth: 0.3, frequency: 14 },
  },
};