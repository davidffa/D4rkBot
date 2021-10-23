import Command from '../../structures/Command';
import Client from '../../structures/Client';
import CommandContext from '../../structures/CommandContext';
import { ComponentCollector } from '../../structures/Collector';

import { ActionRow, ActionRowComponents, ComponentInteraction, ComponentInteractionSelectMenuData, Message, VoiceChannel } from 'eris';

import { Player, SearchResult } from 'erela.js';

export default class Search extends Command {
  constructor(client: Client) {
    super(client, {
      name: 'search',
      description: 'Procura uma música no YouTube, YouTube Music, SoundCloud, Odysee ou Yandex-Music e toca-a.',
      category: 'Music',
      aliases: ['procurar', 'searchmusic'],
      cooldown: 5,
      usage: '[yt/ytm/sc/od/ym] <Nome>',
      args: 1
    });
  }

  async execute(ctx: CommandContext): Promise<void> {
    if (ctx.channel.type !== 0) return;
    if (!ctx.channel.permissionsOf(this.client.user.id).has('embedLinks')) {
      ctx.sendMessage({ content: ':x: Preciso da permissão `Anexar Links` para executar este comando', flags: 1 << 6 });
      return;
    }

    const currPlayer = this.client.music.players.get(ctx.guild.id);

    if (!this.client.music.canPlay(ctx, currPlayer)) return;

    const voiceChannelID = ctx.member?.voiceState.channelID as string;
    const voiceChannel = this.client.getChannel(voiceChannelID) as VoiceChannel;

    const createPlayer = (): Player => {
      const player = this.client.music.create({
        guild: ctx.guild.id,
        voiceChannel: voiceChannelID,
        textChannel: ctx.channel.id,
        selfDeafen: true
      });

      player.effects = [];
      return player;
    }

    const formatString = (str: string, lim: number): string => {
      if (str.length <= lim) return str;
      return `${str.slice(0, lim - 3)}...`;
    }

    const emojis = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];

    try {
      let res: SearchResult;

      const sources: any = {
        yt: 'youtube',
        ytm: 'youtubemusic',
        od: 'odysee',
        sc: 'soundcloud',
        ym: 'yandex'
      }

      if (['yt', 'ytm', 'sc', 'od', 'ym'].includes(ctx.args[0].toLowerCase())) {
        if (ctx.args.length < 1) {
          ctx.sendMessage({ content: `:x: Argumentos em falta. **Usa:** \`${this.client.guildCache.get(ctx.guild.id)!.prefix}${this.name} ${this.usage}\``, flags: 1 << 6 });
          return;
        }
        res = await this.client.music.search({ source: sources[ctx.args[0].toLowerCase()], query: ctx.args.slice(1).join(' ') }, ctx.author);
      } else {
        res = await this.client.music.search(ctx.args.join(' '), ctx.author);
      }

      if (res.loadType === 'SEARCH_RESULT') {
        const tracks = res.tracks.slice(0, 10);

        let desc = '';

        for (var i = 1; i <= tracks.length; i++) {
          desc += `${i}º - [${res.tracks[i - 1].title}](${res.tracks[i - 1].uri})\n`;
        }

        const menu: ActionRowComponents[] = [
          {
            custom_id: 'menu',
            type: 3,
            min_values: 1,
            max_values: tracks.length,
            placeholder: 'Escolhe as músicas para adicionar à lista',
            options: tracks.map((track, idx) => {
              return {
                emoji: { name: emojis[idx] },
                label: formatString(track.author || 'Desconhecido', 75),
                description: formatString(track.title, 100),
                value: idx.toString()
              }
            })
          },
        ];

        const btns: ActionRowComponents[] = [
          {
            custom_id: 'cancel',
            type: 2,
            style: 4,
            emoji: { name: '🗑️' }
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

        const embed = new this.client.embed()
          .setColor('RANDOM')
          .setTitle(':mag: Resultados da procura')
          .setDescription(desc)
          .setFooter(`${ctx.author.username}#${ctx.author.discriminator}`, ctx.author.dynamicAvatarURL())
          .setTimestamp();

        const msg = await ctx.sendMessage({ embeds: [embed], components: [menuRow, btnRow], fetchReply: true }) as Message;

        const searchCollector = this.client.music.searchCollectors.get(ctx.author.id);

        if (searchCollector) {
          searchCollector.message.edit({ content: ':x: Pesquisa cancelada!', embeds: [], components: [] });
          searchCollector.collector.stop('New Search');
          this.client.music.searchCollectors.delete(ctx.author.id);
        }

        const filter = (i: ComponentInteraction) => i.member!.id === ctx.author.id;
        const collector = new ComponentCollector(this.client, msg, filter, { max: 1, time: 20000 });

        this.client.music.searchCollectors.set(ctx.author.id, { message: msg, collector });

        collector.on('collect', i => {
          switch (i.data.custom_id) {
            case 'cancel':
              i.editParent({ content: ':x: Pesquisa cancelada!', embeds: [], components: [] });
              break;
            case 'menu':
              const player = currPlayer || createPlayer();

              if (player.radio) {
                player.stop();
                delete player.radio;
              }

              if (player.state === 'DISCONNECTED') {
                if (!voiceChannel.permissionsOf(this.client.user.id).has('manageChannels') && voiceChannel.userLimit && voiceChannel.voiceMembers.size >= voiceChannel.userLimit) {
                  ctx.channel.createMessage({ content: ':x: O canal de voz está cheio!', flags: 1 << 6 });
                  player.destroy();
                  return;
                }
                player.connect();
              }

              const data = i.data as ComponentInteractionSelectMenuData;

              const selectedTracks = data.values.map(val => tracks[Number(val)]);

              selectedTracks.forEach(t => player.queue.add(t));

              const ebd = new this.client.embed()
                .setColor('RANDOM')
                .setTitle(':bookmark_tabs: Adicionado à lista')
                .setDescription(selectedTracks.map(t => {
                  return `[${t.title}](${t.uri})`;
                }).join('\n'))
                .setFooter(`${ctx.author.username}#${ctx.author.discriminator}`, ctx.author.dynamicAvatarURL())
                .setTimestamp();

              i.editParent({ embeds: [ebd], components: [] });

              if (!player.playing) player.play();
              break;
          }
        });

        collector.on('end', reason => {
          this.client.music.searchCollectors.delete(ctx.author.id);
          if (reason === 'Time')
            msg.edit({ content: ':x: Pesquisa cancelada!', embeds: [], components: [] });
        });
      } else {
        ctx.channel.createMessage({ content: ':x: Não encontrei nenhum resultado!', flags: 1 << 6 });
      }
    } catch (err) {
      console.error(err);
      ctx.channel.createMessage({ content: ':x: Ocorreu um erro ao procurar a música.', flags: 1 << 6 });
    }
  }
}