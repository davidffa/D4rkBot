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
      ctx.sendMessage(':x: Preciso da permissão `Anexar Links` para executar este comando');
      return;
    }

    const player = this.client.music.players.get(ctx.msg.guildID as string);

    if (!player) {
      ctx.sendMessage(`:x: Não estou a tocar nada. **Usa:**\`${this.client.guildCache.get(ctx.msg.guildID as string)}play <Nome/URL>\``);
      return;
    }

    const voiceChannelID = ctx.msg.member?.voiceState.channelID;

    if (!voiceChannelID || (voiceChannelID && voiceChannelID !== player.voiceChannel)) {
      ctx.sendMessage(':x: Precisas de estar no meu canal de voz para usar esse comando!');
      return;
    }

    if (!player.radio && player.queue.duration > 8.64e7) {
      ctx.sendMessage(':x: A queue tem a duração superior a 24 horas!')
      return;
    }

    const member = ctx.msg.member;
    const voiceChannel = this.client.getChannel(voiceChannelID);
    if (!member || !voiceChannel || voiceChannel.type !== 2) return;

    const isDJ = await this.client.music.hasDJRole(member)

    if (this.client.guildCache.get(ctx.msg.guildID as string)?.djRole) {
      if (!isDJ && voiceChannel.voiceMembers.filter(m => !m.bot).length > 1) {
        ctx.sendMessage(':x: Apenas alguém com o cargo DJ pode usar este comando!');
        return;
      }
    }

    try {
      const res = await this.client.music.search(ctx.args.join(' '), ctx.author);

      if (res.loadType === 'LOAD_FAILED') {
        ctx.sendMessage(':x: Falha ao carregar a música.');
      } else if (res.loadType === 'NO_MATCHES') {
        ctx.sendMessage(':x: Nenhuma música encontrada.');
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
            .setFooter(`${ctx.author.username}#${ctx.author.discriminator}`, ctx.author.dynamicAvatarURL());

          const urlRegex = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/

          urlRegex.test(ctx.args[0]) && embed.setURL(ctx.args[0]);

          ctx.sendMessage({ embed });
        } else {
          const tracks = res.tracks;

          player.queue.unshift(tracks[0]);
          player.stop();
        }
      }
    } catch (err) {
      console.error(err);
      ctx.sendMessage(':x: Ocorreu um erro ao procurar a música.');
    }
  }
}