import Command from '../../structures/Command';
import Client from '../../structures/Client';
import CommandContext from '../../structures/CommandContext';

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

  async execute(ctx: CommandContext): Promise<void> {
    if (ctx.channel.type !== 0) return;
    if (!ctx.channel.permissionsOf(this.client.user.id).has('embedLinks')) {
      ctx.sendMessage({ content: ':x: Preciso da permissão `Anexar Links` para executar este comando', flags: 1 << 6 });
      return;
    }

    const player = this.client.music.players.get(ctx.guild.id);

    if (!player) {
      ctx.sendMessage({ content: `:x: Não estou a tocar nada. **Usa:**\`${this.client.guildCache.get(ctx.guild.id)?.prefix}play <Nome/URL>\``, flags: 1 << 6 });
      return;
    }

    const voiceChannelID = ctx.member?.voiceState.channelID;

    if (!voiceChannelID || (voiceChannelID && voiceChannelID !== player.voiceChannelId)) {
      ctx.sendMessage({ content: ':x: Precisas de estar no meu canal de voz para usar esse comando!', flags: 1 << 6 });
      return;
    }

    if (!player.radio && player.queueDuration > 8.64e7) {
      ctx.sendMessage({ content: ':x: A queue tem a duração superior a 24 horas!', flags: 1 << 6 })
      return;
    }

    const member = ctx.member;
    const voiceChannel = this.client.getChannel(voiceChannelID);
    if (!member || !voiceChannel || voiceChannel.type !== 2) return;

    const isDJ = await this.client.music.hasDJRole(member)

    if (this.client.guildCache.get(ctx.guild.id)?.djRole) {
      if (!isDJ && voiceChannel.voiceMembers.filter(m => !m.bot).length > 1) {
        ctx.sendMessage({ content: ':x: Apenas alguém com o cargo DJ pode usar este comando!', flags: 1 << 6 });
        return;
      }
    }

    try {
      const res = await this.client.music.search(ctx.args.join(' '));

      if (res.loadType === 'LOAD_FAILED') {
        ctx.sendMessage(`:x: Falha ao carregar a música. Erro: ${res.exception?.message}`);
      } else if (res.loadType === 'NO_MATCHES') {
        ctx.sendMessage(':x: Nenhuma música encontrada.');
      } else {
        if (res.loadType === 'PLAYLIST_LOADED') {
          const playlist = res.playlistInfo;
          res.tracks.reverse();

          for (const track of res.tracks) {
            track.setRequester(ctx.author);
            player.queue.unshift(track);
          }

          player.skip();

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
          player.queue.unshift(tracks[0]);
          player.skip();
        }
      }
    } catch (err) {
      console.error(err);
      ctx.sendMessage({ content: ':x: Ocorreu um erro ao procurar a música.', flags: 1 << 6 });
    }
  }
}