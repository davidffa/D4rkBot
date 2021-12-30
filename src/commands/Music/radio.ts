import Command from '../../structures/Command';
import Client from '../../structures/Client';
import CommandContext from '../../structures/CommandContext';

import { ConnectionState } from 'vulkava';
export default class Radio extends Command {
  constructor(client: Client) {
    super(client, {
      name: 'radio',
      description: 'Toca uma estação de rádio.',
      usage: '[Nome da Estação]',
      cooldown: 5,
      category: 'Music'
    });
  }

  async execute(ctx: CommandContext): Promise<void> {
    if (ctx.channel.type !== 0) return;
    if (!ctx.channel.permissionsOf(this.client.user.id).has('embedLinks')) {
      ctx.sendMessage({ content: ':x: Preciso da permissão `Anexar Links` para executar este comando', flags: 1 << 6 });
      return;
    }

    const radios = {
      M80: 'https://mcrscast1.mcr.iol.pt/m80',
      CidadeFM: 'https://mcrscast.mcr.iol.pt/cidadefm',
      CidadeHipHop: 'https://mcrscast.mcr.iol.pt/cidHiphop',
      RFM: 'https://22533.live.streamtheworld.com/RFMAAC.aac',
      RadioComercial: 'https://mcrscast1.mcr.iol.pt/comercial'
    };

    const radio = Object.entries(radios).find(([radio]) => radio.toLowerCase() === ctx.args?.join('').toLowerCase());

    if (!radio) {
      const embed = new this.client.embed()
        .setTitle('<a:disco:803678643661832233> Lista de estações de rádio disponíveis')
        .setColor('RANDOM')
        .setDescription(Object.keys(radios).join(', '))
        .setTimestamp()
        .setFooter(`${ctx.author.username}#${ctx.author.discriminator}`, ctx.author.dynamicAvatarURL());

      ctx.sendMessage({ embeds: [embed] });
      return;
    }

    const voiceChannelID = ctx.member?.voiceState.channelID;
    const currPlayer = this.client.music.players.get(ctx.guild.id);

    if (!voiceChannelID) {
      ctx.sendMessage({ content: ':x: Precisas de estar num canal de voz para executar esse comando!', flags: 1 << 6 });
      return;
    }

    const voiceChannel = this.client.getChannel(voiceChannelID);

    if (voiceChannel.type !== 2) {
      ctx.sendMessage({ content: ':x: Ocorreu um erro! `Channel type is not VoiceChannel`', flags: 1 << 6 });
      return;
    }

    if (currPlayer && voiceChannelID !== currPlayer.voiceChannelId) {
      ctx.sendMessage({ content: ':x: Precisas de estar no meu canal de voz para usar este comando!', flags: 1 << 6 });
      return;
    }

    const permissions = voiceChannel.permissionsOf(this.client.user.id);

    if (!permissions.has('readMessages')) {
      ctx.sendMessage({ content: ':x: Não tenho permissão para ver o teu canal de voz!', flags: 1 << 6 });
      return;
    }

    if (!permissions.has('voiceConnect')) {
      ctx.sendMessage({ content: ':x: Não tenho permissão para entrar no teu canal de voz!', flags: 1 << 6 });
      return;
    }

    if (!permissions.has('voiceSpeak')) {
      ctx.sendMessage({ content: ':x: Não tenho permissão para falar no teu canal de voz!', flags: 1 << 6 });
      return;
    }

    let player = this.client.music.players.get(ctx.guild.id);

    if (player && player.radio === radio[0]) {
      ctx.sendMessage({ content: ':x: Essa rádio já está a tocar!', flags: 1 << 6 });
      return;
    }

    if (player && !player.radio) {
      if (this.client.guildCache.get(ctx.guild.id)?.djRole) {
        if (voiceChannel.voiceMembers.filter(m => !m.bot).length !== 1
          && (ctx.member && !await this.client.music.hasDJRole(ctx.member) && !voiceChannel.permissionsOf(ctx.member).has('voiceMoveMembers'))) {
          ctx.sendMessage({ content: ':x: Apenas quem requisitou todas as músicas da queue, alguém com o cargo DJ ou alguém com a permissão `Mover Membros` pode usar este comando!', flags: 1 << 6 });
          return;
        }
      }
    } else {
      player = this.client.music.createPlayer({
        guildId: ctx.guild.id,
        voiceChannelId: voiceChannelID,
        textChannelId: ctx.channel.id,
        selfDeaf: true
      })
      player.effects = [];
    }

    await ctx.defer();

    try {
      const res = await this.client.music.search(radio[1]);

      if (res.loadType !== 'TRACK_LOADED') {
        ctx.sendMessage({ content: ':x: Ocorreu um erro ao tocar a rádio.', flags: 1 << 6 });
        player.destroy();
        return;
      }

      if (player.state === ConnectionState.DISCONNECTED) {
        if (!voiceChannel.permissionsOf(this.client.user.id).has('manageChannels')
          && voiceChannel.userLimit && voiceChannel.voiceMembers.size >= voiceChannel.userLimit) {
          ctx.sendMessage({ content: ':x: O canal de voz está cheio!', flags: 1 << 6 });
          player.destroy();
          return;
        }
        player.connect();
      }

      if (player.current) {
        player.queue = [];
        player.skip();
      }

      player.textChannelId = ctx.channel.id;

      res.tracks[0].setRequester(ctx.author);
      player.queue.push(res.tracks[0]);

      if (!player.playing)
        player.play();

      player.radio = radio[0];

      const embed = new this.client.embed()
        .setTitle(`<a:disco:803678643661832233> A Tocar a rádio ${player.radio}`)
        .setColor('RANDOM')
        .setTimestamp()
        .setFooter(`${ctx.author.username}#${ctx.author.discriminator}`, ctx.author.dynamicAvatarURL());
      ctx.sendMessage({ embeds: [embed] });
    } catch (err) {
      console.error(err);
      player.destroy();
      ctx.sendMessage({ content: ':x: Ocorreu um erro ao tocar a rádio.', flags: 1 << 6 });
    }
  }
}