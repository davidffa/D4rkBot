import Command from '../../structures/Command';
import Client from '../../structures/Client';
import CommandContext from '../../structures/CommandContext';
import { ReactionCollector, MessageCollector } from '../../structures/Collector';

import { Message, User, Emoji as ErisEmoji } from 'eris';

import fetch from 'node-fetch';

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

    if (!ctx.channel.permissionsOf(this.client.user.id).has('embedLinks')) {
      ctx.sendMessage(':x: Preciso da permissão `Anexar Links` para executar este comando');
      return;
    }

    if (!ctx.channel.permissionsOf(this.client.user.id).has('addReactions')) {
      ctx.sendMessage(':x: Preciso da permissão `Adicionar Reações` para executar este comando');
      return;
    }

    if (ctx.args[0]) {
      const unicodeEmojiInfo: UnicodeEmojiInfo | undefined = require('unicode-emoji-json')[ctx.args[0]];

      if (unicodeEmojiInfo) {
        const emojiAPIInfo = await fetch(`https://emoji-api.com/emojis?search=${unicodeEmojiInfo.slug}&access_key=${process.env.EMOJIAPIKEY}`).then(res => res.json());

        const embed = new this.client.embed()
          .setColor('RANDOM')
          .setDescription(`Informação do emoji \`${ctx.args[0]}\``)
          .setTitle(':grinning: Emoji Info')
          .addField(':bookmark_tabs: Nome', `\`${unicodeEmojiInfo.name}\``, true)
          .addField(':newspaper:  Slug', `\`${unicodeEmojiInfo.slug}\``, true)
          .addField(':books: Grupo', `\`${unicodeEmojiInfo.group}\``, true)
          .addField(':link: Versão do emoji', `\`${unicodeEmojiInfo.emoji_version}\``, true)
          .addField(':pushpin: Versão de unicode', `\`${unicodeEmojiInfo.unicode_version}\``, true)
          .setTimestamp()
          .setFooter(`${ctx.author.username}#${ctx.author.discriminator}`, ctx.author.dynamicAvatarURL());

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

        ctx.sendMessage({ embed });
        return;
      }
    }

    if (!ctx.channel.guild.emojis.length) {
      ctx.sendMessage(':x: Este servidor não tem emojis :frowning2:.');
      return;
    }

    if (!ctx.args.length) {
      const emojiList: Array<string> = [];

      ctx.guild.emojis.forEach((emoji: GuildEmoji) => {
        emoji.animated ? emojiList.push(`<a:${emoji.name}:${emoji.id}>`) : emojiList.push(`<:${emoji.name}:${emoji.id}>`);
      });

      let page = 1;
      const pages = Math.ceil(emojiList.length / 30);

      const embed = new this.client.embed()
        .setColor('RANDOM')
        .setDescription(`Lista dos emojis do servidor\n\n${emojiList.slice(0, 30).join(' | ')}`)
        .setTimestamp()
        .setFooter(`Página ${page} de ${pages}`, ctx.author.dynamicAvatarURL());

      const msg = await ctx.sendMessage({ embed });

      if (emojiList.length > 30) {
        ctx.sentMsg.addReaction('⬅️');
        ctx.sentMsg.addReaction('➡️');

        const filter = (r: ErisEmoji, user: User) => (r.name === '⬅️' || r.name === '➡️') && user === ctx.author;
        const collector = new ReactionCollector(this.client, ctx.sentMsg, filter, { time: 5 * 60 * 1000 });

        collector.on('collect', async r => {
          if (ctx.sentMsg.channel.type !== 0) return;

          if (ctx.sentMsg.channel.permissionsOf(this.client.user.id).has('manageMessages')) {
            ctx.sentMsg.removeReaction(r.name, ctx.author.id);
          }

          switch (r.name) {
            case '⬅️':
              if (page === 1) return;
              page--;
              break;
            case '➡️':
              if (page === pages) return;
              page++;
              break;
          }

          embed.setDescription(`Lista dos emojis do servidor\n\n${emojiList.slice((page - 1) * 30, page * 30).join(' | ')}`)
            .setFooter(`Página ${page} de ${pages}`, ctx.author.dynamicAvatarURL());
          ctx.editMessage({ embed });
        });
      }
      return;
    }

    const getEmojiInfo = (emoji: GuildEmoji) => {
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
        .setFooter(`${ctx.author.username}#${ctx.author.discriminator}`, ctx.author.dynamicAvatarURL());

      ctx.sendMessage({ embed });
    }

    if (ctx.args[0].split(':').length === 3) {
      const e = ctx.guild.emojis.find((emoji: GuildEmoji) => emoji.id === ctx.args[0].split(':')[2].slice(0, -1));

      if (!e) {
        ctx.sendMessage(':x: Não encontrei esse emoji!');
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
      ctx.sendMessage(':x: Não encontrei esse emoji!');
      return;
    }

    if (emojiList.length === 1) {
      getEmojiInfo(emojiList[0]);
      return;
    }

    const emojiStringList = emojiList.slice(0, 20).map((emoji: GuildEmoji, idx) => {
      return `${idx + 1} - <${emoji.animated ? 'a' : ''}:${emoji.name}:${emoji.id}>`;
    });

    const embed = new this.client.embed()
      .setTitle(':grinning: Lista de emojis encontrados')
      .setColor('RANDOM')
      .setDescription(`${emojiStringList.join('\n')}\nEscreve um número de **1** a **${emojiList.length >= 20 ? '20' : emojiList.length}** para obter informação sobre esse emoji`)
      .setTimestamp()
      .setFooter(`${ctx.author.username}#${ctx.author.discriminator}`, ctx.author.dynamicAvatarURL());

    await ctx.sendMessage({ embed });

    const filter = (m: Message) => m.author.id === ctx.author.id && parseInt(m.content) >= 1 && parseInt(m.content) <= 20;
    const collector = new MessageCollector(this.client, ctx.channel, filter, { max: 1, time: 20000 });

    collector.on('collect', m => {
      ctx.sentMsg.delete();
      getEmojiInfo(emojiList[Number(m.content) - 1]);
    });
  }
}