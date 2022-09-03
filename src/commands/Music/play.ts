import Command from '../../structures/Command';
import Client from '../../structures/Client';
import CommandContext from '../../structures/CommandContext';

import { AutocompleteInteraction, VoiceChannel } from 'eris';

import { Player, ConnectionState } from 'vulkava';

import { Choices } from '../../typings/index';
import { TrackQueue } from '../../structures/TrackQueue';

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
      const player = this.client.music.createPlayer({
        guildId: ctx.guild?.id as string,
        voiceChannelId: voiceChannelID,
        textChannelId: ctx.channel.id,
        selfDeaf: true,
        queue: new TrackQueue()
      });

      player.effects = [];
      return player;
    }

    try {
      const res = await this.client.music.search(ctx.args.join(' '));

      if (res.loadType === 'LOAD_FAILED') {
        ctx.sendMessage(`:x: Falha ao carregar a música. Erro: \`${res.exception?.message}\``);
      } else if (res.loadType === 'NO_MATCHES') {
        ctx.sendMessage(':x: Nenhuma música encontrada.');
      } else {
        const player = currPlayer || createPlayer();

        if (player.radio) {
          player.skip();
          delete player.radio;
        }

        if (player.state === ConnectionState.DISCONNECTED) {
          if (!voiceChannel.permissionsOf(this.client.user.id).has('manageChannels') && voiceChannel.userLimit && voiceChannel.voiceMembers.size >= voiceChannel.userLimit) {
            ctx.sendMessage({ content: ':x: O canal de voz está cheio!', flags: 1 << 6 });
            player.destroy();
            return;
          }
          player.connect();
        }

        player.textChannelId = ctx.channel.id;

        if (res.loadType === 'PLAYLIST_LOADED') {
          const playlist = res.playlistInfo;

          for (const track of res.tracks) {
            track.setRequester(ctx.author);
            player.queue.add(track);
          }

          if (!player.playing)
            player.play();

          const embed = new this.client.embed()
            .setColor('RANDOM')
            .setTitle('<a:disco:803678643661832233> Playlist Carregada')
            .addField(":page_with_curl: Nome:", '`' + playlist.name + '`')
            .addField("<a:infinity:838759634361253929> Quantidade de músicas:", '`' + res.tracks.length + '`')
            .addField(':watch: Duração', `\`${this.client.utils.msToHour(playlist?.duration || 0)}\``)
            .setTimestamp()
            .setFooter(`${ctx.author.username}#${ctx.author.discriminator}`, ctx.author.dynamicAvatarURL());

          const urlRegex = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/

          urlRegex.test(ctx.args[0]) && embed.setURL(ctx.args[0]);

          ctx.sendMessage({ embeds: [embed] });
        } else {
          const tracks = res.tracks;

          tracks[0].setRequester(ctx.author);
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

  async runAutoComplete(interaction: AutocompleteInteraction, value: string) {
    if (!value) {
      interaction.result([]);
      return;
    }

    const res = await this.client.request(`https://clients1.google.com/complete/search?client=youtube&hl=pt-PT&ds=yt&q=${encodeURIComponent(value)}`, {
      headers: {
        'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.60 Safari/537.36'
      }
    }).then(async r => Buffer.from(await r.body.arrayBuffer()).toString('latin1'));

    const choices: Choices[] = [];

    const data = res.split('[');

    for (var i = 3, min = Math.min(8 * 2, data.length); i < min; i += 2) {
      const choice = data[i].split('"')[1]?.replace(/\\u([0-9a-fA-F]{4})/g, (_, cc) => String.fromCharCode(parseInt(cc, 16)));

      if (choice) {
        choices.push({
          name: choice,
          value: choice
        })
      }
    }

    interaction.result(choices);
  }
}