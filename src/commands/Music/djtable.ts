import Command from '../../structures/Command';
import Client from '../../structures/Client';
import CommandContext from '../../structures/CommandContext';

import { Effect } from '../../typings/index';

import { ActionRow, ActionRowComponents, ComponentInteraction, InteractionComponentSelectMenuData, Message } from 'eris';
import { ComponentCollector } from '../../structures/Collector';

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
      ctx.sendMessage({
        content: ':x: Preciso da permissão `Anexar Links` para executar este comando',
        flags: 1 << 6
      });
      return;
    }

    const player = this.client.music.players.get(ctx.guild.id);

    if (!player) {
      ctx.sendMessage({ content: ':x: Não estou a tocar nada de momento!', flags: 1 << 6 });
      return;
    }

    const voiceChannelID = ctx.member!.voiceState.channelID;

    if (!voiceChannelID || (voiceChannelID && voiceChannelID !== player.voiceChannelId)) {
      ctx.sendMessage({ content: ':x: Precisas de estar no meu canal de voz para usar esse comando!', flags: 1 << 6 });
      return;
    }

    const voiceChannel = this.client.getChannel(voiceChannelID);

    if (voiceChannel.type !== 2) return;

    const member = ctx.member;
    if (!member) return;

    const menu: ActionRowComponents[] = [
      {
        custom_id: 'menu',
        type: 3,
        placeholder: 'Escolhe um filtro para ativar/desativar',
        options: [
          {
            label: 'Bass',
            value: 'bass',
            emoji: {
              name: '1️⃣'
            }
          },
          {
            label: 'Pop',
            value: 'pop',
            emoji: {
              name: '2️⃣'
            }
          },
          {
            label: 'Soft',
            value: 'soft',
            emoji: {
              name: '3️⃣'
            }
          },
          {
            label: 'Treblebass',
            value: 'treblebass',
            emoji: {
              name: '4️⃣'
            }
          },
          {
            label: 'Nightcore',
            value: 'nightcore',
            emoji: {
              name: '5️⃣'
            }
          },
          {
            label: 'Vaporwave',
            value: 'vaporwave',
            emoji: {
              name: '6️⃣'
            }
          },
          {
            label: 'Lowpass',
            value: 'lowpass',
            emoji: {
              name: '7️⃣'
            }
          },
          {
            label: '8D',
            value: '8D',
            emoji: {
              name: '8️⃣'
            }
          },
        ]
      },
    ];

    const btns: ActionRowComponents[] = [
      {
        custom_id: 'clear',
        type: 2,
        style: 4,
        emoji: { id: null, name: '🗑️' }
      },
      {
        custom_id: 'close',
        type: 2,
        style: 4,
        label: 'Fechar'
      }
    ]

    const menuRow: ActionRow = {
      type: 1,
      components: menu
    }

    const btnRow: ActionRow = {
      type: 1,
      components: btns
    }

    const sendFilterMessage = async (): Promise<void> => {
      if (player.djTableMsg) {
        ctx.sendMessage({ content: ':x: Já existe uma mesa de DJ aberta!', flags: 1 << 6 });
        return;
      }
      const effects: Effect[] = ['bass', 'pop', 'soft', 'treblebass', 'nightcore', 'vaporwave', 'lowpass', '8D'];

      const embed = new this.client.embed()
        .setTitle('<a:disco:803678643661832233> Mesa de DJ')
        .setColor('RANDOM')
        .setDescription(`:wastebasket: Remove todos os filtros ativos\n\n${effects.map((effect) => `${effect.charAt(0).toUpperCase()}${effect.slice(1)} **[${player.effects.includes(effect) ? '<:on:764478511875751937>' : '<:off:764478504124416040>'}]**`).join('\n')}`)
        .setThumbnail('https://i.pinimg.com/564x/a3/a9/29/a3a929cc8d09e88815b89bc071ff4d8d.jpg')
        .setTimestamp()
        .setFooter(`${ctx.author.username}#${ctx.author.discriminator}`, ctx.author.dynamicAvatarURL());

      const msg = await ctx.sendMessage({ embeds: [embed], components: [menuRow, btnRow], fetchReply: true }) as Message;
      player.djTableMsg = msg;

      const filter = (i: ComponentInteraction) => i.member!.id === ctx.author.id;

      const collector = new ComponentCollector(this.client, msg, filter, { max: 20, time: 90000 });

      collector.on('collect', i => {
        switch (i.data.custom_id) {
          case 'menu':
            const data = i.data as InteractionComponentSelectMenuData;

            const val = data.values[0] as Effect;

            if (player.effects.includes(val)) {
              player.effects.splice(player.effects.indexOf(val), 1);
            } else {
              player.effects.push(val);
            }

            const filters = {}
            for (const effect of player.effects) {
              Object.assign(filters, configs[effect]);
            }

            player.filters.set(filters);

            embed.setDescription(`:wastebasket: Remove todos os filtros ativos\n\n${effects.map((effect) => `${effect.charAt(0).toUpperCase()}${effect.slice(1)} **[${player.effects.includes(effect) ? '<:on:764478511875751937>' : '<:off:764478504124416040>'}]**`).join('\n')}`);
            i.editParent({ embeds: [embed] });
            break;
          case 'clear':
            player.filters.clear();
            player.effects = [];
            embed.setDescription(`:wastebasket: Remove todos os filtros ativos\n\n${effects.map((effect) => `${effect.charAt(0).toUpperCase()}${effect.slice(1)} **[${player.effects.includes(effect) ? '<:on:764478511875751937>' : '<:off:764478504124416040>'}]**`).join('\n')}`);
            i.editParent({ embeds: [embed] });
            break;
          case 'close':
            delete player.djTableMsg;

            i.editParent({ content: '<a:disco:803678643661832233> Mesa de DJ fechada!', embeds: [], components: [] });
            break;
        }
      });

      collector.on('end', (r) => {
        delete player.djTableMsg;

        if (r === 'Time')
          msg.edit({ content: '<a:disco:803678643661832233> Mesa de DJ fechada!', embeds: [], components: [] });
      });
    }

    const isDJ = await this.client.music.hasDJRole(member);
    if (this.client.guildCache.get(ctx.guild.id)?.djRole) {
      if (isDJ || ctx.author === player.current?.requester || voiceChannel.voiceMembers.filter(m => !m.bot).length === 1) {
        sendFilterMessage();
        return;
      }
      ctx.channel.createMessage({ content: ':x: Apenas quem requisitou esta música ou alguém com o cargo DJ pode usar a mesa de DJ!', flags: 1 << 6 });
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
  lowpass: {
    lowPass: { smoothing: 15 }
  },
  '8D': { rotation: { rotationHz: .2 } }
};