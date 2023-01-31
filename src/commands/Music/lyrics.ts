import Command from '../../structures/Command';
import Client from '../../structures/Client';
import CommandContext from '../../structures/CommandContext';
import { ComponentCollector } from '../../structures/Collector';

import { ComponentInteraction, Message, MessageActionRow } from 'oceanic.js';
import { dynamicAvatar } from '../../utils/dynamicAvatar';

interface LyricsRes {
  lyrics: string[];
  albumArt: string;
  url: string;
}

export default class Lyrics extends Command {
  constructor(client: Client) {
    super(client, {
      name: 'lyrics',
      description: 'Mostra a letra de uma música.',
      category: 'Music',
      aliases: ['letra'],
      cooldown: 6,
      usage: '[Nome da música] - [Artista]',
    });
  }

  async execute(ctx: CommandContext): Promise<void> {
    if (ctx.channel.type !== 0) return;

    if (!ctx.channel.permissionsOf(this.client.user.id).has('EMBED_LINKS')) {
      ctx.sendMessage({ content: ':x: Preciso da permissão `Anexar Links` para executar este comando', flags: 1 << 6 });
      return;
    }

    await ctx.defer();

    const lyrics = async (name: string, artist?: string | null): Promise<LyricsRes | null> => {
      const song = `${name} ${artist}`
        .toLowerCase()
        .replace(/ *\([^)]*\) */g, '')
        .replace(/ *\[[^\]]*]/, '')
        .replace(/feat.|ft./g, '')
        .replace(/\s+/g, ' ')
        .trim();

      const res = await fetch(`https://api.genius.com/search?q=${encodeURIComponent(song)}`, {
        headers: {
          'Authorization': `Bearer ${process.env.GENIUSLYRICSTOKEN}`
        }
      }).then(res => res.json());

      if (!res.response.hits.length) return null;

      const data = res.response.hits[0].result;

      const lyrics = await fetch(`${process.env.LYRICSAPIURL}?url=${encodeURIComponent(data.url)}`).then(res => res.json()).then(json => json.lyrics);

      return {
        lyrics,
        albumArt: data.song_art_image_url,
        url: data.url
      };
    }

    let res: LyricsRes | null;
    let artist, title;

    if (!ctx.args.length) {
      const player = this.client.music.players.get(ctx.guild.id);

      if (!player || !player.current) {
        const activity = ctx.member?.presence?.activities?.find(a => a.name === 'Spotify');

        if (activity && activity.details) {
          title = activity.details;
          artist = activity.state;

          res = await lyrics(title, artist);
        } else {
          ctx.sendMessage({
            content: `:x: Não estou a tocar nenhuma música de momento!\nTambém podes usar \`/lyrics [Nome da música] - [Artista]\` para procurar uma letra de música.\n_P.S. Também deteto se estiveres a ouvir alguma música do spotify!_`,
            flags: 1 << 6
          });
          return;
        }

      } else {
        if (player.radio) {
          const np = await this.client.music.getRadioNowPlaying(player.radio);
          artist = np.artist;
          title = np.songTitle;
        } else {
          const titleArr = player.current.title.split('-');
          artist = titleArr[0];
          title = titleArr[1] ?? player.current.author;
        }

        if (title) {
          res = await lyrics(title, artist);
        } else {
          res = await lyrics(player.current.title);
        }
      }
    } else {
      const data = ctx.args.join(' ').split('-');

      if (data.length === 1)
        res = await lyrics(data[0].trim());
      else
        res = await lyrics(data[0].trim(), data[1].trim());

    }

    if (!res) {
      if (ctx.args.join(' ').split('-').length === 1) {
        ctx.sendMessage({
          content: `:x: Não encontrei nenhum resultado.\nExperimenta usar \`/lyrics <Nome da música> - <Artista>\``,
          flags: 1 << 6
        });
      } else {
        ctx.sendMessage({ content: ':x: Não encontrei nenhum resultado.', flags: 1 << 6 });
      }
      return;
    }

    const row: MessageActionRow = {
      type: 1,
      components: [
        {
          customID: 'left',
          style: 2,
          type: 2,
          emoji: {
            id: null,
            name: '⬅'
          },
          disabled: true
        },
        {
          customID: 'right',
          style: 2,
          type: 2,
          emoji: {
            id: null,
            name: '➡'
          }
        }
      ]
    }

    let page = 1;
    const pages = Math.ceil(res.lyrics.length / 20);

    const embed = new this.client.embed()
      .setColor('RANDOM')
      .setTitle(ctx.args.join(' ') || `${artist} - ${title}`)
      .setDescription(res.lyrics.slice(0, 20).join('\n'))
      .setThumbnail(res.albumArt)
      .setURL(res.url)
      .setTimestamp()
      .setFooter(`Página ${page} de ${pages}`, dynamicAvatar(ctx.author));

    const msg = await ctx.sendMessage({ embeds: [embed], components: [row], fetchReply: true }) as Message;

    const filter = (i: ComponentInteraction) => i.member!.id === ctx.author.id;

    const collector = new ComponentCollector(this.client, msg, filter, { time: 6 * 60 * 1000, max: 20 });

    const changePage = (i: ComponentInteraction): void => {
      if (!res) return;

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

      embed.setDescription(res.lyrics.slice((page - 1) * 20, page * 20).join('\n'))
        .setFooter(`Página ${page} de ${pages}`, dynamicAvatar(ctx.author));

      i.editParent({ embeds: [embed], components: [row] });
    }

    collector.on('collect', i => {
      changePage(i);
    });

    collector.on('end', (r) => {
      if (r === 'Time') {
        row.components[0].disabled = true;
        row.components[1].disabled = true;
        msg.edit({ components: [row] });
      }
    });
  }
}