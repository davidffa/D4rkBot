import Command from '../../structures/Command';
import Client from '../../structures/Client';
import CommandContext from '../../structures/CommandContext';
import { ComponentCollector } from '../../structures/Collector';

import { ActionRow, ComponentInteraction, ActionRowComponents, Message, VoiceChannel } from 'eris';

import { Track, UnresolvedTrack, ConnectionState } from 'vulkava';

export default class PlayList extends Command {
  constructor(client: Client) {
    super(client, {
      name: 'playlist',
      description: 'Cria uma playlist, adiciona músicas a uma playlist ou adiciona à queue uma playlist.',
      cooldown: 4,
      category: 'Music'
    });
  }

  async execute(ctx: CommandContext): Promise<void> {
    if (ctx.channel.type === 0 && !ctx.channel.permissionsOf(this.client.user.id).has('embedLinks')) {
      ctx.sendMessage({ content: ':x: Preciso da permissão `Anexar Links` para executar este comando!', flags: 1 << 6 });
      return;
    }

    const prefix = this.client.guildCache.get(ctx.guild.id)?.prefix || 'db.';
    let player = this.client.music.players.get(ctx.guild.id);

    if (!ctx.args.length || ['ajuda', 'help'].includes(ctx.args[0]) || !['shuffle', 'embaralhar', 'renomear', 'rename', 'add', 'detalhes', 'details', 'adicionar', 'criar', 'create', 'delete', 'remove', 'remover', 'apagar', 'excluir', 'tocar', 'play', 'listar', 'lista', 'list'].includes(ctx.args[0])) {
      const help = [
        `# ${prefix}playlist criar <Nome> - Cria uma playlist`,
        `# ${prefix}playlist apagar <Nome> - Apaga uma playlist`,
        `# ${prefix}playlist renomear <Nome Antigo> <Nome Novo> - Renomeia uma playlist`,
        `# ${prefix}playlist detalhes <Nome> - Lista todas as músicas de uma playlist`,
        `# ${prefix}playlist shuffle <Nome> - Embaralha as músicas de uma playlist`,
        `# ${prefix}playlist listar - Lista de todas as tuas playlists`,
        `# ${prefix}playlist adicionar <Nome> [Nome da música] - Adiciona a uma playlist a música que está a tocar ou uma música específica`,
        `# ${prefix}playlist remover <Nome> <Número da música> - Remove uma música da playlist`,
        `# ${prefix}playlist tocar <Nome> - Adiciona à queue todas as músicas de uma playlist`,
      ];

      const embed = new this.client.embed()
        .setTitle('Ajuda do comando PlayList')
        .setColor('RANDOM')
        .setDescription(`\`\`\`md\n${help.join('\n─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─\n')}\n\`\`\``)
        .setTimestamp()
        .setFooter(`${ctx.author.username}#${ctx.author.discriminator}`, ctx.author.dynamicAvatarURL());

      ctx.sendMessage({ embeds: [embed] });
      return;
    }

    const userData = await this.client.userDB.findById(ctx.author.id);

    const playlists = userData?.playlists;

    switch (ctx.args[0].toLowerCase()) {
      case 'criar':
      case 'create':
        if (!ctx.args[1]) {
          ctx.sendMessage({ content: `:x: **Usa:** ${prefix}playlist criar <Nome da PlayList>`, flags: 1 << 6 });
          return;
        }

        if (ctx.args[1].length > 32) {
          ctx.sendMessage({ content: ':x: O nome da playlist não pode ter mais do que 32 caracteres.', flags: 1 << 6 });
          return;
        }

        if (playlists) {
          if (playlists.length > 30) {
            ctx.sendMessage({ content: ':x: Não podes ter mais de 30 playlists', flags: 1 << 6 })
            return;
          }

          if (playlists.find(it => it.name === ctx.args[1])) {
            ctx.sendMessage({ content: ':x: Já tens uma playlist com esse nome!', flags: 1 << 6 });
            return;
          }

          await this.client.userDB.updateOne({
            _id: ctx.author.id
          }, {
            $push: { playlists: { name: ctx.args[1] } }
          });
        } else {
          await this.client.userDB.create({
            _id: ctx.author.id,
            playlists: [
              { name: ctx.args[1] }
            ],
          });
        }

        ctx.sendMessage('<a:disco:803678643661832233> Playlist criada com sucesso!');
        break;

      case 'rename':
      case 'renomear':
        if (!ctx.args[1] || !ctx.args[2]) {
          ctx.sendMessage({ content: `:x: **Usa:** ${prefix}playlist renomear <Nome Antigo> <Nome Novo>`, flags: 1 << 6 });
          return;
        }

        if (ctx.args[2].length > 32) {
          ctx.sendMessage({ content: ':x: O nome da playlist não pode ter mais de 32 caracteres!', flags: 1 << 6 });
          return;
        }

        if (!playlists || !playlists.length) {
          ctx.sendMessage({ content: ':x: Não tens nenhuma playlist!', flags: 1 << 6 });
          return;
        }

        const rPlaylist = playlists.find(it => it.name === ctx.args[1]);

        if (!rPlaylist) {
          ctx.sendMessage({ content: ':x: Não tens nenhuma playlist com esse nome!', flags: 1 << 6 });
          return;
        }

        rPlaylist.name = ctx.args[2];
        userData && await userData.save();

        ctx.sendMessage('<a:verificado:803678585008816198> Playlist renomeada com sucesso!');
        break;

      case 'delete':
      case 'apagar':
      case 'excluir':
        if (!playlists || !playlists.length) {
          ctx.sendMessage({ content: ':x: Não tens nenhuma playlist!', flags: 1 << 6 });
          return;
        }

        if (!playlists.find(it => it.name === ctx.args[1])) {
          ctx.sendMessage({ content: ':x: Não tens nenhuma playlist com esse nome!', flags: 1 << 6 });
          return;
        }

        await this.client.userDB.updateOne({
          _id: ctx.author.id
        }, {
          $pull: { playlists: { name: ctx.args[1] } }
        });

        ctx.sendMessage('<a:verificado:803678585008816198> Playlist apagada com sucesso!');
        break;

      case 'lista':
      case 'listar':
      case 'list':
        if (!playlists || !playlists.length) {
          ctx.sendMessage({ content: ':x: Não tens nenhuma playlist!', flags: 1 << 6 });
          return;
        }

        const listEmbed = new this.client.embed()
          .setTitle('<a:disco:803678643661832233> Lista de Playlists')
          .setColor('RANDOM')
          .setDescription(`${playlists.map(p => `${p.name} - \`${(p.tracks && p.tracks.length) || 0}\` músicas`).join('\n')}`)
          .setTimestamp()
          .setFooter(`${ctx.author.username}#${ctx.author.discriminator}`, ctx.author.dynamicAvatarURL());

        ctx.sendMessage({ embeds: [listEmbed] });
        break;

      case 'detalhes':
      case 'details':
        if (!playlists || !playlists.length) {
          ctx.sendMessage({ content: ':x: Não tens nenhuma playlist!', flags: 1 << 6 });
          return;
        }

        if (!ctx.args[1]) {
          ctx.sendMessage({ content: `:x: **Usa:** ${prefix}playlist detalhes <Nome da playlist>`, flags: 1 << 6 });
          return;
        }

        const playlist = playlists.find(it => it.name === ctx.args[1]);

        if (!playlist) {
          ctx.sendMessage({ content: ':x: Não tens nenhuma playlist com esse nome!', flags: 1 << 6 });
          return;
        }

        if (!playlist.tracks || !playlist.tracks.length) {
          ctx.sendMessage({ content: ':x: Essa playlist não tem músicas!', flags: 1 << 6 });
          return;
        }

        const tracks = await this.client.music.decodeTracks(playlist.tracks);

        const detailEmbed = new this.client.embed()
          .setTitle('<a:disco:803678643661832233> Lista de Músicas')
          .setColor('RANDOM')
          .setDescription(`**${playlist.name}** - \`${tracks.length}\` músicas\n\n${tracks.slice(0, 10).map((track, idx) => `${idx + 1}º - [${track.title}](${track.uri})`).join('\n')}`)
          .setTimestamp()
          .setFooter(`${ctx.author.username}#${ctx.author.discriminator}`, ctx.author.dynamicAvatarURL());


        if (playlist.tracks.length <= 10) {
          ctx.sendMessage({ embeds: [detailEmbed] });
          return;
        }

        const components: ActionRowComponents[] = [
          {
            custom_id: 'left',
            style: 2,
            type: 2,
            emoji: {
              name: '⬅️'
            },
            disabled: true
          },
          {
            custom_id: 'right',
            style: 2,
            type: 2,
            emoji: {
              name: '➡️'
            }
          }
        ];

        const row: ActionRow = {
          type: 1,
          components
        }

        const msg = await ctx.sendMessage({ embeds: [detailEmbed], components: [row], fetchReply: true }) as Message;

        let page = 1;
        const pages = Math.ceil(playlist.tracks.length / 10);

        const filter = (i: ComponentInteraction) => i.member!.id === ctx.author.id;

        const collector = new ComponentCollector(this.client, msg, filter, { time: 5 * 60 * 1000 });

        collector.on('collect', i => {
          if (!playlist || !playlist.tracks) return;

          switch (i.data.custom_id) {
            case 'left':
              if (page === 1) return;
              if (--page === 1) {
                row.components[0].disabled = true;
              }
              row.components[1].disabled = false;
              detailEmbed.setDescription(tracks.slice((page - 1) * 10, page * 10).map((track, idx) => `${idx + ((page - 1) * 10) + 1}º - [${track.title}](${track.uri})`).join('\n'))
                .setFooter(`Página ${page} de ${pages}`, ctx.author.dynamicAvatarURL());

              i.editParent({ embeds: [detailEmbed], components: [row] });
              break;
            case 'right':
              if (page === pages) return;
              if (++page === pages) {
                row.components[1].disabled = true;
              }
              row.components[0].disabled = false;
              detailEmbed.setDescription(tracks.slice((page - 1) * 10, page * 10).map((track, idx) => `${idx + ((page - 1) * 10) + 1}º - [${track.title}](${track.uri})`).join('\n'))
                .setFooter(`Página ${page} de ${pages}`, ctx.author.dynamicAvatarURL());

              i.editParent({ embeds: [detailEmbed], components: [row] });
              break;
          }
        });

        collector.on('end', (r) => {
          if (r === 'Time') {
            row.components[0].disabled = true;
            row.components[1].disabled = true;
            msg.edit({ components: [row] });
          }
        })
        break;

      case 'remove':
      case 'remover':
        if (!userData || !playlists || !playlists.length) {
          ctx.sendMessage({ content: ':x: Não tens nenhuma playlist!', flags: 1 << 6 });
          return;
        }

        const playList = playlists.find(it => it.name === ctx.args[1]);

        if (!playList) {
          ctx.sendMessage({ content: ':x: Não tens nenhuma playlist com esse nome!', flags: 1 << 6 });
          return;
        }

        if (!playList.tracks || !playList.tracks.length) {
          ctx.sendMessage({ content: ':x: Essa playlist não tem nenhuma música!', flags: 1 << 6 });
          return;
        }

        const id = parseInt(ctx.args[2]);

        if (!id || !playList.tracks[id - 1]) {
          ctx.sendMessage({ content: `:x: ID da música inválido!\n**Usa:** ${prefix}playlist detalhes <Nome> para ver o id da música a remover.`, flags: 1 << 6 });
          return;
        }

        const songName = await this.client.music.decodeTrack(playList.tracks[id - 1]).then(t => t.title);

        playList.tracks.splice(id - 1, 1);
        await userData.save();

        ctx.sendMessage(`<a:verificado:803678585008816198> Removeste a música \`${songName}\` da playlist!`);
        break;
      case 'add':
      case 'adicionar':
        if (!ctx.args[1]) {
          ctx.sendMessage({ content: `:x: **Usa:** ${prefix}playlist add <Nome da PlayList> [Nome da música]`, flags: 1 << 6 });
          return;
        }

        const pl = playlists?.find(playlist => playlist.name === ctx.args[1]);

        if (!pl) {
          ctx.sendMessage({ content: ':x: Playlist não encontrada', flags: 1 << 6 });
          return;
        }

        if (pl.tracks && pl.tracks.length >= 70) {
          ctx.sendMessage({ content: ':x: Não podes ter uma playlist com mais de 70 músicas', flags: 1 << 6 });
          return;
        }

        let track: Track;

        if (ctx.args[2]) {
          const res = await this.client.music.search(ctx.args.slice(2).join(' '));

          if (res.loadType === 'SEARCH_RESULT' || res.loadType === 'TRACK_LOADED') {
            if (res.tracks[0] instanceof UnresolvedTrack) {
              track = await res.tracks[0].build();
            } else {
              track = res.tracks[0];
            }
          } else if (res.loadType === 'PLAYLIST_LOADED') {
            const tracksB64 = (await Promise.all(res.tracks.map(async t => {
              if (t instanceof UnresolvedTrack) {
                return await t.build().then(t => t.encodedTrack);
              } else return t.encodedTrack;
            }))).filter(b64 => !pl.tracks?.includes(b64));

            if (!tracksB64.length) {
              ctx.sendMessage({ content: ':x: Todas as músicas dessa playlist já estão na tua playlist do bot!', flags: 1 << 6 });
              return;
            }

            if ((pl.tracks?.length ?? 0) + tracksB64.length >= 70) {
              ctx.sendMessage({ content: ':x: Não podes ter uma playlist com mais de 70 músicas', flags: 1 << 6 });
              return;
            }

            pl.tracks = pl.tracks?.concat(tracksB64) ?? tracksB64;
            userData && await userData.save();

            ctx.sendMessage(`<a:verificado:803678585008816198> \`${tracksB64.length}\` músicas adicionadas à playlist!`);

            return;
          } else {
            ctx.sendMessage({ content: ':x: Não foi possível adicionar essa música à playlist.', flags: 1 << 6 });
            return;
          }
        } else if (player) {
          track = player.current as Track;
        } else {
          ctx.sendMessage({ content: `:x: **Usa:** ${prefix}playlist add <Nome da Playlist> [Nome da música]`, flags: 1 << 6 });
          return;
        }

        if (!pl.tracks) pl.tracks = [];

        if (track.isStream) {
          ctx.sendMessage({ content: ':x: Não podes adicionar uma stream a uma playlist.', flags: 1 << 6 });
          return;
        }

        const trackArr = await this.client.music.decodeTracks(pl.tracks);

        if (trackArr.find(t => t.uri === track.uri)) {
          ctx.sendMessage({ content: ':x: Essa música já está na playlist.', flags: 1 << 6 });
          return;
        }

        pl.tracks.push(track.encodedTrack);

        userData && await userData.save();

        ctx.sendMessage(`<a:disco:803678643661832233> Música \`${track.title}\` adicionada à playlist!`);
        break;
      case 'shuffle':
      case 'embaralhar':
        if (!ctx.args[1]) {
          ctx.sendMessage({ content: `:x: **Usa:** ${prefix}playlist shuffle <Nome da PlayList>`, flags: 1 << 6 });
          return;
        }

        const plToShuffle = playlists?.find(playlist => playlist.name === ctx.args[1]);

        if (!plToShuffle) {
          ctx.sendMessage({ content: ':x: Playlist não encontrada', flags: 1 << 6 });
          return;
        }

        if (!plToShuffle.tracks || !plToShuffle.tracks.length) {
          ctx.sendMessage({ content: ':x: Essa playlist não tem músicas!', flags: 1 << 6 });
          return;
        }

        plToShuffle.tracks = plToShuffle.tracks.sort(() => Math.random() - 0.5);
        userData && userData.save();

        ctx.sendMessage('<a:verificado:803678585008816198> Playlist embaralhada com sucesso!');
        break;
      case 'play':
      case 'tocar':
        if (!ctx.args[1]) {
          ctx.sendMessage({ content: `:x: **Usa:** ${prefix}playlist tocar <Nome da PlayList>`, flags: 1 << 6 });
          return;
        }

        const list = playlists?.find(playlist => playlist.name === ctx.args[1]);

        if (!list) {
          ctx.sendMessage({ content: ':x: Playlist não encontrada', flags: 1 << 6 });
          return;
        }

        const songs = list.tracks;

        if (!songs) {
          ctx.sendMessage({ content: ':x: Essa playlist não tem músicas!', flags: 1 << 6 });
          return;
        }

        if (!this.client.music.canPlay(ctx, player)) return;

        const voiceChannelID = ctx.member?.voiceState.channelID as string;
        const voiceChannel = this.client.getChannel(voiceChannelID) as VoiceChannel;

        player = this.client.music.createPlayer({
          guildId: ctx.guild.id,
          voiceChannelId: voiceChannelID,
          textChannelId: ctx.channel.id,
          selfDeaf: true
        });

        player.effects = [];

        if (player.state === ConnectionState.DISCONNECTED) {
          if (!voiceChannel.permissionsOf(this.client.user.id).has('manageChannels') && voiceChannel.userLimit && voiceChannel.voiceMembers.size >= voiceChannel.userLimit) {
            ctx.sendMessage({ content: ':x: O canal de voz está cheio!', flags: 1 << 6 });
            player.destroy();
            return;
          }
          player.connect();
        }

        const tracksToLoad = await this.client.music.decodeTracks(songs);

        for (const t of tracksToLoad) {
          t.setRequester(ctx.author);
          player.queue.push(t);
        }

        if (!player.playing) player.play();

        const playEmbed = new this.client.embed()
          .setColor('RANDOM')
          .setTitle('<a:disco:803678643661832233> Playlist Carregada')
          .addField(":page_with_curl: Nome:", '`' + list.name + '`')
          .addField("<a:infinity:838759634361253929> Quantidade de músicas:", '`' + songs.length + '`')
          .setTimestamp()
          .setFooter(`${ctx.author.username}#${ctx.author.discriminator}`, ctx.author.dynamicAvatarURL());

        ctx.sendMessage({ embeds: [playEmbed] });
        break;
    }
  }
}