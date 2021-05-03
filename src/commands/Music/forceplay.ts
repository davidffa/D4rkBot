import Command from '../../structures/Command';
import Client from '../../structures/Client';

import { Message } from 'eris';

export default class Forceplay extends Command {
  constructor(client: Client) {
    super(client, {
      name: 'forceplay',
      description: 'Toca uma música diretamente pulando a atual.',
      category: 'Music',
      aliases: ['fp'],
      cooldown: 4,
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

    const player = this.client.music.players.get(message.guildID as string);

    if (!player) {
      message.channel.createMessage(`:x: Não estou a tocar nada. **Usa:**\`${this.client.guildCache.get(message.guildID as string)}play <Nome/URL>\``);
      return;
    }

    const voiceChannelID = message.member?.voiceState.channelID;

    if (!voiceChannelID || (voiceChannelID && voiceChannelID !== player.voiceChannel)) {
      message.channel.createMessage(':x: Precisas de estar no meu canal de voz para usar esse comando!');
      return;
    }

    if (!player.radio && player.queue.duration > 8.64e7) {
      message.channel.createMessage(':x: A queue tem a duração superior a 24 horas!')
      return;
    }

    const member = message.member;
    const voiceChannel = this.client.getChannel(voiceChannelID);
    if (!member || !voiceChannel || voiceChannel.type !== 2) return;

    const isDJ = await this.client.music.hasDJRole(member)

    if (this.client.guildCache.get(message.guildID as string)?.djRole) {
      if (!isDJ && voiceChannel.voiceMembers.filter(m => !m.bot).length > 1) {
        message.channel.createMessage(':x: Apenas alguém com o cargo DJ pode usar este comando!');
        return;
      }
    }

    try {
      const res = await this.client.music.search(args.join(' '), message.author);

      if (res.loadType === 'LOAD_FAILED') {
        message.channel.createMessage(':x: Falha ao carregar a música.');
      } else if (res.loadType === 'NO_MATCHES') {
        message.channel.createMessage(':x: Nenhuma música encontrada.');
      } else {
        if (res.loadType === 'PLAYLIST_LOADED') {
          const playlist = res.playlist;
          res.tracks.reverse();

          for (const track of res.tracks)
            player.queue.unshift(track);

          player.stop();

          const embed = new this.client.embed()
            .setColor('RANDOM')
            .setTitle('<a:disco:803678643661832233> Playlist Carregada')
            .addField(":page_with_curl: Nome:", '`' + playlist?.name + '`')
            .addField("<a:infinity:838759634361253929> Quantidade de músicas:", '`' + res.tracks.length + '`')
            .addField(':watch: Duração', `\`${this.client.utils.msToHour(res.playlist?.duration || 0)}\``)
            .setTimestamp()
            .setFooter(`${message.author.username}#${message.author.discriminator}`, message.author.dynamicAvatarURL());

          const urlRegex = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/

          urlRegex.test(args[0]) && embed.setURL(args[0]);

          message.channel.createMessage({ embed });
        } else {
          const tracks = res.tracks;

          player.queue.unshift(tracks[0]);
          player.stop();
        }
      }
    } catch (err) {
      console.error(err);
      message.channel.createMessage(':x: Ocorreu um erro ao procurar a música.');
    }
  }
}