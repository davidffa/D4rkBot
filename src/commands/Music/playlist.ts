import Command from '../../structures/Command';
import Client from '../../structures/Client';

import { Message } from 'eris';

import { Track, UnresolvedTrack, TrackUtils } from 'erela.js';

export default class PlayList extends Command {
  constructor(client: Client) {
    super(client, {
      name: 'playlist',
      description: 'Cria uma playlist, adiciona músicas a uma playlist ou adiciona à queue uma playlist',
      cooldown: 4,
      category: 'Music'
    });
  }

  async execute(message: Message, args: string[]): Promise<void> {
    if (message.channel.type === 0 && !message.channel.permissionsOf(this.client.user.id).has('embedLinks')) {
      message.channel.createMessage(':x: Preciso da permissão `Anexar Links` para executar este comando!');
      return;
    }

    const prefix = this.client.guildCache.get(message.guildID as string)?.prefix || 'db.';
    let player = this.client.music.players.get(message.guildID as string);

    if (!args.length || ['ajuda', 'help'].includes(args[0]) || !['add', 'detalhes', 'details', 'adicionar', 'criar', 'create', 'delete', 'remove', 'remover', 'apagar', 'excluir', 'tocar', 'play', 'listar', 'lista', 'list'].includes(args[0])) {
      const help = [
        `${prefix}playlist criar <Nome> - Cria uma playlist`,
        `${prefix}playlist apagar <Nome> - Apaga uma playlist`,
        `${prefix}playlist detalhes <Nome> - Lista todas as músicas de uma PlayList`,
        `${prefix}playlist listar - Lista de todas as tuas playlists`,
        `${prefix}playlist adicionar <Nome> [Nome da música] - Adiciona a uma playlist a música que está a tocar ou uma música específica`,
        `${prefix}playlist remover <Nome> <Número da música> - Remove uma música da playlist`,
        `${prefix}playlist tocar <Nome> - Adiciona à queue todas as músicas de uma playlist`,
      ];
      
      const embed = new this.client.embed()
        .setTitle('Ajuda do comando PlayList')
        .setColor('RANDOM')
        .setDescription(`\`\`\`md\n${help.join('\n-----------------------------------\n')}\n-----------------------------------\`\`\``)
        .setTimestamp()
        .setFooter(`${message.author.username}#${message.author.discriminator}`, message.author.dynamicAvatarURL());
      
      message.channel.createMessage({ embed });
      return;
    }

    const userData = await this.client.userDB.findById(message.author.id);

    const playlists = userData?.playlists;

    switch (args[0].toLowerCase()) {
      case 'criar':
      case 'create':
        if (!args[1]) {
          message.channel.createMessage(`:x: **Usa:** ${prefix}playlist criar <Nome da PlayList>`);
          return;
        }

        if (args[1].length > 32) {
          message.channel.createMessage(':x: O nome da playlist não pode ter mais do que 32 caracteres.');
          return;
        }

        if (playlists) {
          if (playlists.length > 30) {
            message.channel.createMessage(':x: Não podes ter mais de 30 playlists')
            return;
          }

          if (playlists.find(it => it.name === args[1])) {
            message.channel.createMessage(':x: Já tens uma playlist com esse nome!');
            return;
          }

          await this.client.userDB.updateOne({ 
            _id: message.author.id
          }, { 
            $push: { playlists: { name: args[1] } }
          });
        }else {
          await this.client.userDB.create({
            _id: message.author.id,
            playlists: [
              { name: args[1] }
            ],
          });
        }

        message.channel.createMessage('<a:disco:803678643661832233> Playlist criada com sucesso!');
        break;

      case 'delete':
      case 'apagar':
      case 'excluir':
        if (!playlists || !playlists.length) {
          message.channel.createMessage(':x: Não tens nenhuma playlist!');
          return;
        }

        if (!playlists.find(it => it.name === args[1])) {
          message.channel.createMessage(':x: Não tens nenhuma playlist com esse nome!');
          return;
        }

        await this.client.userDB.updateOne({
          _id: message.author.id
        }, {
          $pull: { playlists: { name: args[1] } }
        });

        message.channel.createMessage('<a:verificado:803678585008816198> Playlist apagada com sucesso!');
        break;

      case 'lista':
      case 'listar':
      case 'list':
        if (!playlists || !playlists.length) {
          message.channel.createMessage(':x: Não tens nenhuma playlist!');
          return;
        }

        const listEmbed = new this.client.embed()
          .setTitle('<a:disco:803678643661832233> Lista de Playlists')
          .setColor('RANDOM')
          .setDescription(`${playlists.map(p => `${p.name} - \`${(p.songs && p.songs.length) || 0}\` músicas`).join('\n')}`)
          .setTimestamp()
          .setFooter(`${message.author.username}#${message.author.discriminator}`, message.author.dynamicAvatarURL());
        
        message.channel.createMessage({ embed: listEmbed });
        break;

      case 'detalhes':
      case 'details':
        if (!playlists || !playlists.length) {
          message.channel.createMessage(':x: Não tens nenhuma playlist!');
          return;
        }

        const playlist = playlists.find(it => it.name === args[1]);

        if (!playlist) {
          message.channel.createMessage(':x: Não tens nenhuma playlist com esse nome!');
          return;
        }

        if (!playlist.songs || !playlist.songs.length) {
          message.channel.createMessage(':x: Essa playlist não tem músicas!');
          return;
        }

        const detailEmbed = new this.client.embed()
          .setTitle('<a:disco:803678643661832233> Lista de Músicas')
          .setColor('RANDOM')
          .setDescription(`**${playlist.name}** - \`${playlist.songs.length}\` músicas\n\n${playlist.songs.map((s, idx) => `${idx+1}º - [${s.name}](${s.url})`).join('\n')}`)
          .setTimestamp()
          .setFooter(`${message.author.username}#${message.author.discriminator}`, message.author.dynamicAvatarURL());
        
        message.channel.createMessage({ embed: detailEmbed });
        break;

      case 'remove':
      case 'remover':
        if (!userData || !playlists || !playlists.length) {
          message.channel.createMessage(':x: Não tens nenhuma playlist!');
          return;
        }

        const playList = playlists.find(it => it.name === args[1]);

        if (!playList) {
          message.channel.createMessage(':x: Não tens nenhuma playlist com esse nome!');
          return;
        }

        if (!playList.songs || !playList.songs.length) {
          message.channel.createMessage(':x: Essa playlist não tem nenhuma música!');
          return;
        }

        const id = parseInt(args[2]);

        if (!id || !playList.songs[id-1]) {
          message.channel.createMessage(`:x: ID da música inválido!\n**Usa:** ${prefix}playlist detalhes <Nome> para ver o id da música a remover.`);
          return;
        }

        const songName = playList.songs[id-1].name;

        playList.songs.splice(id-1, 1);
        await userData.save();

        message.channel.createMessage(`<a:verificado:803678585008816198> Removeste a música \`${songName}\` da playlist!`);
        break;
      case 'add':
      case 'adicionar':
        if (!args[1]) {
          message.channel.createMessage(`:x: **Usa:** ${prefix}playlist add <Nome da PlayList> [Nome da música]`);
          return;
        }

        const pl = playlists?.find(playlist => playlist.name === args[1]);

        if (!pl) {
          message.channel.createMessage(':x: Playlist não encontrada');
          return;
        }

        if (pl.songs && pl.songs.length >= 50) {
          message.channel.createMessage(':x: Não podes ter uma playlist com mais de 50 músicas');
          return;
        }

        let track: Track;

        if (args[2]) {
          const res = await this.client.music.search(args.slice(2).join(' '));

          if (res.loadType === 'SEARCH_RESULT' || res.loadType === 'TRACK_LOADED') {
            track = res.tracks[0];
          }else {
            message.channel.createMessage(':x: Não foi possível adicionar essa música à playlist.');
            return;
          }
        }else if (player) {
          track = player.queue.current as Track;
        }else {
          message.channel.createMessage(`:x: **Usa:** ${prefix}playlist add <Nome da PlayList> [Nome da música]`);
          return;
        }
        
        if (!pl.songs) pl.songs = [];
        if (!track || !track.author || !track.duration || !track.duration || !track.uri) {
          message.channel.createMessage(':x: Não foi possível adicionar a música atual a essa playlist.');
          return;
        }

        if (track.isStream) {
          message.channel.createMessage(':x: Não podes adicionar uma stream a uma playlist.');
          return;
        }

        if (pl.songs.find(song => song.url === track.uri)) {
          message.channel.createMessage(':x: Essa música já está na playlist.');
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
        
        message.channel.createMessage(`<a:disco:803678643661832233> Música \`${track.title}\` adicionada à playlist!`);
        break;

      case 'play':
      case 'tocar':
        if (!args[1]) {
          message.channel.createMessage(`:x: **Usa:** ${prefix}playlist tocar <Nome da PlayList>`);
          return;
        }

        const list = playlists?.find(playlist => playlist.name === args[1]);

        if (!list) {
          message.channel.createMessage(':x: Playlist não encontrada');
          return;
        }

        const songs = list.songs;

        if (!songs) {
          message.channel.createMessage(':x: Essa playlist não tem músicas!');
          return;
        }

        const voiceChannelID = message.member?.voiceState.channelID;
  
        if (!voiceChannelID) {
          message.channel.createMessage(':x: Precisas de estar num canal de voz para executar esse comando!');
          return;
        }
  
        const voiceChannel = this.client.getChannel(voiceChannelID);
                
        if (voiceChannel.type !== 2) {
          message.channel.createMessage(':x: Ocorreu um erro! `Channel type is not VoiceChannel`');
          return;
        }
    
        const permissions = voiceChannel.permissionsOf(this.client.user.id);
                
        if (!permissions.has('readMessages')) {
          message.channel.createMessage(':x: Não tenho permissão para ver o teu canal de voz!');
          return;
        }
    
        if (!permissions.has('voiceConnect')) {
          message.channel.createMessage(':x: Não tenho permissão para entrar no teu canal de voz!');
          return;
        }
    
        if (!permissions.has('voiceSpeak')) {
          message.channel.createMessage(':x: Não tenho permissão para falar no teu canal de voz!');
          return;
        }
    
        if (this.client.records.has(message.guildID as string)) {
          message.channel.createMessage(':x: Não consigo tocar música enquanto gravo voz!')
          return;
        }

        if (player && voiceChannelID !== player.voiceChannel) {
          message.channel.createMessage(':x: Precisas de estar no meu canal de voz para usar este comando!');
          return;
        }

        if (player && !player.radio && player.queue.duration > 8.64e7) {
          message.channel.createMessage(':x: A queue tem a duração superior a 24 horas!')
          return
        }
    
        player = this.client.music.create({
          guild: message.guildID as string,
          voiceChannel: voiceChannelID,
          textChannel: message.channel.id,
          selfDeafen: true
        });

        if (player.state === 'DISCONNECTED') {
          if (!voiceChannel.permissionsOf(this.client.user.id).has('manageChannels') && voiceChannel.userLimit && voiceChannel.voiceMembers.size >= voiceChannel.userLimit) {
            message.channel.createMessage(':x: O canal de voz está cheio!');
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
            }, message.author);
          }else {
            song = await this.client.music.search(music.url, message.author).then(r => r.tracks[0]);
          }

          if (!player) return;

          player.queue.add(song);

          if (!player.playing && i === 1) 
            player.play();

          if (i === songs.length-1) {
            const playEmbed = new this.client.embed()
              .setColor('RANDOM')
              .setTitle('<a:disco:803678643661832233> Playlist Carregada')
              .addField(":page_with_curl: Nome:", '`' + list.name + '`')
              .addField("<a:malakoi:478003266815262730> Quantidade de músicas:", '`' + songs.length + '`')
              .setTimestamp()
              .setFooter(`${message.author.username}#${message.author.discriminator}`, message.author.dynamicAvatarURL());
              
            message.channel.createMessage({ embed: playEmbed });
          }
        });
        break;
    }
  }
}