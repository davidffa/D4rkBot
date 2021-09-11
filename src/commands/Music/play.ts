import Command from '../../structures/Command';
import Client from '../../structures/Client';
import CommandContext from '../../structures/CommandContext';

import { VoiceChannel } from 'eris';

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

  async execute(ctx: CommandContext): Promise<void> {
    if (ctx.channel.type !== 0 || !ctx.guild) return;
    if (!ctx.channel.permissionsOf(this.client.user.id).has('embedLinks')) {
      ctx.sendMessage({ content: ':x: Preciso da permissão `Anexar Links` para executar este comando', flags: 1 << 6 });
      return;
    }

    const currPlayer = this.client.music.players.get(ctx.guild.id as string);

    if (!this.client.music.canPlay(ctx, currPlayer)) return;

    const voiceChannelID = ctx.member?.voiceState.channelID as string;
    const voiceChannel = this.client.getChannel(voiceChannelID) as VoiceChannel;

    const createPlayer = (): Player => {
      const player = this.client.music.create({
        guild: ctx.guild?.id as string,
        voiceChannel: voiceChannelID,
        textChannel: ctx.channel.id,
        selfDeafen: true
      });

      player.effects = [];
      return player;
    }

    try {
      const res = await this.client.music.search(ctx.args.join(' '), ctx.author);

      if (res.loadType === 'LOAD_FAILED') {
        ctx.sendMessage(`:x: Falha ao carregar a música. Erro: \`${res.exception?.message}\``);
      } else if (res.loadType === 'NO_MATCHES') {
        ctx.sendMessage(':x: Nenhuma música encontrada.');
      } else {
        const player = currPlayer || createPlayer();

        if (player.radio) {
          player.stop();
          delete player.radio;
        }

        if (player.state === 'DISCONNECTED') {
          if (!voiceChannel.permissionsOf(this.client.user.id).has('manageChannels') && voiceChannel.userLimit && voiceChannel.voiceMembers.size >= voiceChannel.userLimit) {
            ctx.sendMessage({ content: ':x: O canal de voz está cheio!', flags: 1 << 6 });
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
            .addField("<a:infinity:838759634361253929> Quantidade de músicas:", '`' + res.tracks.length + '`')
            .addField(':watch: Duração', `\`${this.client.utils.msToHour(res.playlist?.duration || 0)}\``)
            .setTimestamp()
            .setFooter(`${ctx.author.username}#${ctx.author.discriminator}`, ctx.author.dynamicAvatarURL());

          const urlRegex = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/

          urlRegex.test(ctx.args[0]) && embed.setURL(ctx.args[0]);

          ctx.sendMessage({ embeds: [embed] });
        } else {
          const tracks = res.tracks;

          player.queue.add(tracks[0]);

          ctx.sendMessage(`:bookmark_tabs: Adicionado à lista \`${tracks[0].title}\``);

          if (!player.playing)
            player.play();
        }
      }
    } catch (err: any) {
      ctx.sendMessage(`:x: Ocorreu um erro ao procurar a música.\nErro: \`${err.message}\``);
    }
  }
}