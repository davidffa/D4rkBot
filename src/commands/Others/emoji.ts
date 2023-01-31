import Command from '../../structures/Command';
import Client from '../../structures/Client';
import CommandContext from '../../structures/CommandContext';
import { ComponentCollector } from '../../structures/Collector';

import { Message, ComponentInteraction, MessageActionRow, MessageComponentSelectMenuInteractionData } from 'oceanic.js';
import { dynamicAvatar } from '../../utils/dynamicAvatar';

interface UnicodeEmojiInfo {
  name: string;
  slug: string;
  group: string;
  emoji_version: string;
  unicode_version: string;
  skin_tone_support: boolean;
}

interface GuildEmoji {
  animated: boolean;
  id: string;
  name: string;
}

export default class Emoji extends Command {
  constructor(client: Client) {
    super(client, {
      name: 'emoji',
      description: 'Procura emojis e obtém informação sobre eles ou lista todos os emojis do servidor.',
      usage: '[nome]',
      category: 'Others',
      aliases: ['searchemoji', 'emojis', 'procuraremoji', 'emojiinfo'],
      cooldown: 5
    });
  }

  async execute(ctx: CommandContext): Promise<void> {
    if (ctx.channel.type !== 0 || !ctx.guild) return;

    if (!ctx.channel.permissionsOf(this.client.user.id).has('EMBED_LINKS')) {
      ctx.sendMessage({ content: ':x: Preciso da permissão `Anexar Links` para executar este comando', flags: 1 << 6 });
      return;
    }

    if (ctx.args[0]) {
      const unicodeEmojiInfo: UnicodeEmojiInfo | undefined = require('unicode-emoji-json')[ctx.args[0]];

      if (unicodeEmojiInfo) {
        const emojiAPIInfo = await this.client.request(`https://emoji-api.com/emojis?search=${unicodeEmojiInfo.slug}&access_key=${process.env.EMOJIAPIKEY}`).then(res => res.body.json());

        const embed = new this.client.embed()
          .setColor('RANDOM')
          .setDescription(`Informação do emoji \`${ctx.args[0]}\``)
          .setTitle(':grinning: Emoji Info')
          .addField(':bookmark_tabs: Nome', `\`${unicodeEmojiInfo.name}\``, true)
          .addField(':newspaper:  Slug', `\`${unicodeEmojiInfo.slug}\``, true)
          .addField(':books: Grupo', `\`${unicodeEmojiInfo.group}\``, true)
          .addField(':pushpin: Versão unicode', `\`${unicodeEmojiInfo.unicode_version}\``, true)
          .setTimestamp()
          .setFooter(`${ctx.author.username}#${ctx.author.discriminator}`, dynamicAvatar(ctx.author));

        if (emojiAPIInfo) {
          const emoji = emojiAPIInfo[0];
          embed.addField(':book: Sub-grupo', `\`${emoji.subGroup}\``, true)
            .addField(':id: Código', `\`${emoji.codePoint}\``, true)

          if (emoji.codePoint.length === 5) {
            embed.setThumbnail(`https://twemoji.maxcdn.com/v/latest/72x72/${emoji.codePoint.toLowerCase()}.png`)
              .setURL(`https://twemoji.maxcdn.com/v/latest/72x72/${emoji.codePoint.toLowerCase()}.png`)
          }
        }

        embed.addField(`:handshake: Suporte para tom de pele`, `\`${unicodeEmojiInfo.skin_tone_support ? 'Sim' : 'Não'}\``, true);

        ctx.sendMessage({ embeds: [embed] });
        return;
      }
    }

    if (!ctx.channel.guild.emojis.length) {
      ctx.sendMessage({ content: ':x: Este servidor não tem emojis :frowning2:.', flags: 1 << 6 });
      return;
    }

    if (!ctx.args.length) {
      const emojiList: Array<string> = [];

      ctx.guild.emojis.forEach((emoji: GuildEmoji) => {
        emoji.animated ? emojiList.push(`<a:${emoji.name}:${emoji.id}>`) : emojiList.push(`<:${emoji.name}:${emoji.id}>`);
      });

      const row: MessageActionRow = {
        type: 1,
        components: [
          {
            customID: 'left',
            style: 2,
            type: 2,
            emoji: {
              id: null,
              name: '⬅️'
            },
            disabled: true
          },
          {
            customID: 'right',
            style: 2,
            type: 2,
            emoji: {
              id: null,
              name: '➡️'
            }
          }
        ]
      };

      let page = 1;
      const pages = Math.ceil(emojiList.length / 30);

      const embed = new this.client.embed()
        .setColor('RANDOM')
        .setDescription(`Lista dos emojis do servidor\n\n${emojiList.slice(0, 30).join(' | ')}`)
        .setTimestamp()
        .setFooter(`Página ${page} de ${pages}`, dynamicAvatar(ctx.author));

      if (emojiList.length <= 30) {
        ctx.sendMessage({ embeds: [embed] });
        return;
      }

      const msg = await ctx.sendMessage({ embeds: [embed], components: [row], fetchReply: true }) as Message;

      const filter = (i: ComponentInteraction) => i.member!.id === ctx.author.id;
      const collector = new ComponentCollector(this.client, msg, filter, { time: 5 * 60 * 1000 });

      collector.on('collect', async i => {
        switch (i.data.customID) {
          case 'left':
            if (page === 1) return;
            if (--page === 1) {
              row.components[0].disabled = true;
            }
            row.components[1].disabled = false;
            break;
          case 'right':
            if (page === pages) return;
            if (++page === pages) {
              row.components[1].disabled = true;
            }
            row.components[0].disabled = false;
            break;
        }

        embed.setDescription(`Lista dos emojis do servidor\n\n${emojiList.slice((page - 1) * 30, page * 30).join(' | ')}`)
          .setFooter(`Página ${page} de ${pages}`, dynamicAvatar(ctx.author));
        i.editParent({ embeds: [embed], components: [row] });
      });

      return;
    }

    const getEmojiInfo = (emoji: GuildEmoji, i?: ComponentInteraction) => {
      const createdAt = Math.floor(Number(emoji.id) / 4194304) + 1420070400000;
      const url = `https://cdn.discordapp.com/emojis/${emoji.id}.${emoji.animated ? 'gif' : 'png'}`;

      const embed = new this.client.embed()
        .setTitle(':grinning: Emoji Info')
        .setColor('RANDOM')
        .addField('Animado:', `\`${emoji.animated ? 'Sim' : 'Não'}\``, true)
        .addField('Adicionado em:', `<t:${Math.floor(createdAt / 1e3)}:d>`, true)
        .addField('ID:', `\`${emoji.id}\``, true)
        .addField('Nome:', `\`${emoji.name}\``, true)
        .addField('Identificador:', `\`${emoji.animated ? `<a:${emoji.name}:${emoji.id}>` : `<:${emoji.name}:${emoji.id}>`}\``, true)
        .setURL(url)
        .setThumbnail(url)
        .setTimestamp()
        .setFooter(`${ctx.author.username}#${ctx.author.discriminator}`, dynamicAvatar(ctx.author));

      if (i) i.editParent({ embeds: [embed], components: [] });
      else ctx.sendMessage({ embeds: [embed] });
    }

    if (ctx.args[0].split(':').length === 3) {
      const e = ctx.guild.emojis.find((emoji: GuildEmoji) => emoji.id === ctx.args[0].split(':')[2].slice(0, -1));

      if (!e) {
        ctx.sendMessage({ content: ':x: Não encontrei esse emoji!', flags: 1 << 6 });
        return;
      }
      getEmojiInfo(e);
      return;
    }

    const emojiList: Array<GuildEmoji> = [];

    ctx.channel.guild.emojis.forEach((emoji: GuildEmoji) => {
      if (emoji.name.includes(ctx.args[0]) || emoji.id === ctx.args[0]) {
        emojiList.push(emoji);
      }
    });

    if (!emojiList.length) {
      ctx.sendMessage({ content: ':x: Não encontrei esse emoji!', flags: 1 << 6 });
      return;
    }

    if (emojiList.length === 1) {
      getEmojiInfo(emojiList[0]);
      return;
    }

    const row: MessageActionRow = {
      type: 1,
      components: [
        {
          customID: 'menu',
          type: 3,
          placeholder: 'Escolhe um emoji para ver mais informação',
          options: emojiList.slice(0, 20).map((emoji: GuildEmoji, idx) => {
            return {
              label: emoji.name,
              value: '' + idx,
              emoji: {
                id: emoji.id,
                name: emoji.name,
                animated: emoji.animated
              },
            }
          })
        },
      ]
    };

    const msg = await ctx.sendMessage({ content: '\u200B', components: [row], fetchReply: true }) as Message;

    const filter = (i: ComponentInteraction) => i.member!.id === ctx.author.id;
    const collector = new ComponentCollector(this.client, msg, filter, { max: 1, time: 20000 });

    collector.on('collect', i => {
      const data = i.data as MessageComponentSelectMenuInteractionData;
      getEmojiInfo(emojiList[Number(data.values.raw[0])], i);
    });
  }
}