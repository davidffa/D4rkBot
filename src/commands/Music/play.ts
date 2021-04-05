import Command from '../../structures/Command';
import Client from '../../structures/Client';
import Filters from '../../structures/Filters';

import { Message, VoiceChannel } from 'eris';

import { Player } from 'erela.js';

export default class Play extends Command {
  constructor(client: Client) {
    super(client, {
      name: 'play',
      description: 'Toca uma música ou adiciona-a na lista.',
      category: 'Music',
      aliases: ['p', 'tocar'],
      cooldown: 2,
      usage: '<Nome/URL>',
      args: 1
    });
  }

  async execute(message: Message, args: Array<string>): Promise<void> {
    if (message.channel.type !== 0) return;
    if (!message.channel.permissionsOf(this.client.user.id).has('embedLinks')) {
      message.channel.createMessage(':x: Preciso da permissão `Anexar Links` para executar este comando');
      return;
    }

    const currPlayer = this.client.music.players.get(message.guildID as string);

    if (!this.client.music.canPlay(message, currPlayer)) return;

    const voiceChannelID = message.member?.voiceState.channelID as string;
    const voiceChannel = this.client.getChannel(voiceChannelID) as VoiceChannel;

    const createPlayer = (): Player => {
      const player = this.client.music.create({
        guild: message.guildID as string,
        voiceChannel: voiceChannelID,
        textChannel: message.channel.id,
        selfDeafen: true
      });

      player.filters = new Filters(player);
      return player;
    }

    try {
      const res = await this.client.music.search(args.join(' '), message.author);

      if (res.loadType === 'LOAD_FAILED') {
        message.channel.createMessage(':x: Falha ao carregar a música.');
      } else if (res.loadType === 'NO_MATCHES') {
        message.channel.createMessage(':x: Nenhuma música encontrada.');
      } else {
        const player = currPlayer || createPlayer();

        if (player.radio) {
          player.stop();
          delete player.radio;
        }

        if (player.state === 'DISCONNECTED') {
          if (!voiceChannel.permissionsOf(this.client.user.id).has('manageChannels') && voiceChannel.userLimit && voiceChannel.voiceMembers.size >= voiceChannel.userLimit) {
            message.channel.createMessage(':x: O canal de voz está cheio!');
            player.destroy();
            return;
          }
          player.connect();
        }

        if (res.loadType === 'PLAYLIST_LOADED') {
          const playlist = res.playlist;

          for (const track of res.tracks)
            player.queue.add(track);

          if (!player.playing)
            player.play();

          const embed = new this.client.embed()
            .setColor('RANDOM')
            .setTitle('<a:disco:803678643661832233> Playlist Carregada')
            .addField(":page_with_curl: Nome:", '`' + playlist?.name + '`')
            .addField("<a:malakoi:478003266815262730> Quantidade de músicas:", '`' + res.tracks.length + '`')
            .addField(':watch: Duração', `\`${this.client.utils.msToHour(res.playlist?.duration || 0)}\``)
            .setTimestamp()
            .setFooter(`${message.author.username}#${message.author.discriminator}`, message.author.dynamicAvatarURL());

          const urlRegex = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/

          urlRegex.test(args[0]) && embed.setURL(args[0]);

          message.channel.createMessage({ embed });
        } else {
          const tracks = res.tracks;

          player.queue.add(tracks[0]);

          if (!player.playing)
            player.play();
          else
            message.channel.createMessage(`:bookmark_tabs: Adicionado à lista \`${tracks[0].title}\``);
        }
      }
    } catch (err) {
      console.error(err);
      message.channel.createMessage(':x: Ocorreu um erro ao procurar a música.');
    }
  }
}