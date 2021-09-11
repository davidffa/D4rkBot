import Command from '../../structures/Command';
import Client from '../../structures/Client';
import CommandContext from '../../structures/CommandContext';
import { ReactionCollector } from '../../structures/Collector';

import { Emoji, Message, User, VoiceChannel } from 'eris';

import { Track, UnresolvedTrack, TrackUtils } from 'erela.js';

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
          .setDescription(`${playlists.map(p => `${p.name} - \`${(p.songs && p.songs.length) || 0}\` músicas`).join('\n')}`)
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

        if (!playlist.songs || !playlist.songs.length) {
          ctx.sendMessage({ content: ':x: Essa playlist não tem músicas!', flags: 1 << 6 });
          return;
        }

        const detailEmbed = new this.client.embed()
          .setTitle('<a:disco:803678643661832233> Lista de Músicas')
          .setColor('RANDOM')
          .setDescription(`**${playlist.name}** - \`${playlist.songs.length}\` músicas\n\n${playlist.songs.slice(0, 10).map((s, idx) => `${idx + 1}º - [${s.name}](${s.url})`).join('\n')}`)
          .setTimestamp()
          .setFooter(`${ctx.author.username}#${ctx.author.discriminator}`, ctx.author.dynamicAvatarURL());

        const msg = await ctx.sendMessage({ embeds: [detailEmbed] }, true) as Message;

        if (playlist.songs.length <= 10) return;

        let page = 1;
        const pages = Math.ceil(playlist.songs.length / 10);

        msg.addReaction('⬅️');
        msg.addReaction('➡️');

        const filter = (r: Emoji, user: User) => (r.name === '⬅️' || r.name === '➡️') && user === ctx.author;

        const collector = new ReactionCollector(this.client, msg, filter, { time: 5 * 60 * 1000 });

        collector.on('collect', r => {
          if (ctx.channel.type !== 0) return;
          if (!playlist || !playlist.songs) return;

          switch (r.name) {
            case '⬅️':
              if (page === 1) return;
              page--;
              detailEmbed.setDescription(playlist.songs.slice((page - 1) * 10, page * 10).map((s, idx) => `${idx + ((page - 1) * 10) + 1}º - [${s.name}](${s.url})`).join('\n'))
                .setFooter(`Página ${page} de ${pages}`, ctx.author.dynamicAvatarURL());

              msg.edit({ embed: detailEmbed });

              if (ctx.channel.permissionsOf(this.client.user.id).has('manageMessages')) {
                msg.removeReaction(r.name, ctx.author.id);
              }
              break;
            case '➡️':
              if (page === pages) return;
              page++;
              detailEmbed.setDescription(playlist.songs.slice((page - 1) * 10, page * 10).map((s, idx) => `${idx + ((page - 1) * 10) + 1}º - [${s.name}](${s.url})`).join('\n'))
                .setFooter(`Página ${page} de ${pages}`, ctx.author.dynamicAvatarURL());

              msg.edit({ embed: detailEmbed });

              if (ctx.channel.permissionsOf(this.client.user.id).has('manageMessages')) {
                msg.removeReaction(r.name, ctx.author.id);
              }
              break;
          }
        });

        collector.on('end', () => {
          msg.removeReaction('⬅️');
          msg.removeReaction('➡️')
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

        if (!playList.songs || !playList.songs.length) {
          ctx.sendMessage({ content: ':x: Essa playlist não tem nenhuma música!', flags: 1 << 6 });
          return;
        }

        const id = parseInt(ctx.args[2]);

        if (!id || !playList.songs[id - 1]) {
          ctx.sendMessage({ content: `:x: ID da música inválido!\n**Usa:** ${prefix}playlist detalhes <Nome> para ver o id da música a remover.`, flags: 1 << 6 });
          return;
        }

        const songName = playList.songs[id - 1].name;

        playList.songs.splice(id - 1, 1);
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

        if (pl.songs && pl.songs.length >= 60) {
          ctx.sendMessage({ content: ':x: Não podes ter uma playlist com mais de 60 músicas', flags: 1 << 6 });
          return;
        }

        let track: Track;

        if (ctx.args[2]) {
          const res = await this.client.music.search(ctx.args.slice(2).join(' '));

          if (res.loadType === 'SEARCH_RESULT' || res.loadType === 'TRACK_LOADED') {
            track = res.tracks[0];
          } else {
            ctx.sendMessage({ content: ':x: Não foi possível adicionar essa música à playlist.', flags: 1 << 6 });
            return;
          }
        } else if (player) {
          track = player.queue.current as Track;
        } else {
          ctx.sendMessage({ content: `:x: **Usa:** ${prefix}playlist add <Nome da PlayList> [Nome da música]`, flags: 1 << 6 });
          return;
        }

        if (!pl.songs) pl.songs = [];
        if (!track || !track.author || !track.duration || !track.duration || !track.uri) {
          ctx.sendMessage({ content: ':x: Não foi possível adicionar a música atual a essa playlist.', flags: 1 << 6 });
          return;
        }

        if (track.isStream) {
          ctx.sendMessage({ content: ':x: Não podes adicionar uma stream a uma playlist.', flags: 1 << 6 });
          return;
        }

        if (pl.songs.find(song => song.url === track.uri)) {
          ctx.sendMessage({ content: ':x: Essa música já está na playlist.', flags: 1 << 6 });
          return;
        }

        pl.songs.push({
          author: track.author,
          duration: track.duration,
          name: track.title,
          url: track.uri,
          yt: /www.youtube.com/g.test(track.uri)
        });

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

        if (!plToShuffle.songs || !plToShuffle.songs.length) {
          ctx.sendMessage({ content: ':x: Essa playlist não tem músicas!', flags: 1 << 6 });
          return;
        }

        plToShuffle.songs = plToShuffle.songs.sort(() => Math.random() - 0.5);
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

        const songs = list.songs;

        if (!songs) {
          ctx.sendMessage({ content: ':x: Essa playlist não tem músicas!', flags: 1 << 6 });
          return;
        }

        if (!this.client.music.canPlay(ctx, player)) return;

        const voiceChannelID = ctx.member?.voiceState.channelID as string;
        const voiceChannel = this.client.getChannel(voiceChannelID) as VoiceChannel;

        player = this.client.music.create({
          guild: ctx.guild.id,
          voiceChannel: voiceChannelID,
          textChannel: ctx.channel.id,
          selfDeafen: true
        });

        player.effects = [];

        if (player.state === 'DISCONNECTED') {
          if (!voiceChannel.permissionsOf(this.client.user.id).has('manageChannels') && voiceChannel.userLimit && voiceChannel.voiceMembers.size >= voiceChannel.userLimit) {
            ctx.sendMessage({ content: ':x: O canal de voz está cheio!', flags: 1 << 6 });
            player.destroy();
            return;
          }
          player.connect();
        }

        songs.forEach(async (music, i) => {
          let song: Track | UnresolvedTrack;
          if (music.yt) {
            song = TrackUtils.buildUnresolved({
              title: music.name,
              author: music.author,
              duration: music.duration
            }, ctx.author);
          } else {
            song = await this.client.music.search(music.url, ctx.author).then(r => r.tracks[0]);
          }

          if (!player) return;

          player.queue.add(song);

          if (!player.playing && i === 0)
            player.play();

          if (i === songs.length - 1) {
            const playEmbed = new this.client.embed()
              .setColor('RANDOM')
              .setTitle('<a:disco:803678643661832233> Playlist Carregada')
              .addField(":page_with_curl: Nome:", '`' + list.name + '`')
              .addField("<a:infinity:838759634361253929> Quantidade de músicas:", '`' + songs.length + '`')
              .setTimestamp()
              .setFooter(`${ctx.author.username}#${ctx.author.discriminator}`, ctx.author.dynamicAvatarURL());

            ctx.sendMessage({ embeds: [playEmbed] });
          }
        });
        break;
    }
  }
}