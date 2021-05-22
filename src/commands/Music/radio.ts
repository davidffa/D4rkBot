import Command from '../../structures/Command';
import Client from '../../structures/Client';
import CommandContext from '../../structures/CommandContext';
import Filters from '../../structures/Filters';

import { Message } from 'eris';

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
      ctx.sendMessage(':x: Preciso da permissão `Anexar Links` para executar este comando');
      return;
    }
    
    const radios = {
      M80: 'https://mcrscast1.mcr.iol.pt/m80',
      CidadeFM: 'https://mcrscast.mcr.iol.pt/cidadefm',
      CidadeHipHop: 'https://mcrscast.mcr.iol.pt/cidHiphop',
      RFM: 'http://22343.live.streamtheworld.com/RFMAAC_SC',
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

      ctx.sendMessage({ embed });
      return;
    }

    const voiceChannelID = ctx.msg.member?.voiceState.channelID;
    const currPlayer = this.client.music.players.get(ctx.msg.guildID as string);
        
    if (!voiceChannelID) {
      ctx.sendMessage(':x: Precisas de estar num canal de voz para executar esse comando!');
      return;
    }

    const voiceChannel = this.client.getChannel(voiceChannelID);
        
    if (voiceChannel.type !== 2) {
      ctx.sendMessage(':x: Ocorreu um erro! `Channel type is not VoiceChannel`');
      return;
    }

    if (currPlayer && voiceChannelID !== currPlayer.voiceChannel) {
      ctx.sendMessage(':x: Precisas de estar no meu canal de voz para usar este comando!');
      return;
    }

    const permissions = voiceChannel.permissionsOf(this.client.user.id);
        
    if (!permissions.has('readMessages')) {
      ctx.sendMessage(':x: Não tenho permissão para ver o teu canal de voz!');
      return;
    }

    if (!permissions.has('voiceConnect')) {
      ctx.sendMessage(':x: Não tenho permissão para entrar no teu canal de voz!');
      return;
    }

    if (!permissions.has('voiceSpeak')) {
      ctx.sendMessage(':x: Não tenho permissão para falar no teu canal de voz!');
      return;
    }

    if (this.client.records.has(ctx.msg.guildID as string)) {
      ctx.sendMessage(':x: Não consigo tocar rádio enquanto gravo voz!')
      return;
    }

    let player = this.client.music.players.get(ctx.msg.guildID as string);

    if (player && player.radio === radio[0]) {
      ctx.sendMessage(':x: Essa rádio já está a tocar!');
      return;
    }

    if (player && !player.radio) {
      if (this.client.guildCache.get(ctx.msg.guildID as string)?.djRole) {
        if (voiceChannel.voiceMembers.filter(m => !m.bot).length !== 1
          && (ctx.msg.member && !await this.client.music.hasDJRole(ctx.msg.member) && !voiceChannel.permissionsOf(ctx.msg.member).has('voiceMoveMembers'))) {
            ctx.sendMessage(':x: Apenas quem requisitou todas as músicas da queue, alguém com o cargo DJ ou alguém com a permissão `Mover Membros` pode usar este comando!');
            return;
        }
      }
    }else {
      player = this.client.music.create({
        guild: ctx.msg.guildID as string,
        voiceChannel: voiceChannelID,
        textChannel: ctx.channel.id,
        selfDeafen: true
      })
      player.filters = new Filters(player);
    }

    try {
      const res = await this.client.music.search(radio[1], ctx.author);

      if (res.loadType !== 'TRACK_LOADED') {
        ctx.sendMessage(':x: Ocorreu um erro ao tocar a rádio.');
        player.destroy();
        return;
      }

      if (player.state === 'DISCONNECTED') {
        if (!voiceChannel.permissionsOf(this.client.user.id).has('manageChannels') 
          && voiceChannel.userLimit && voiceChannel.voiceMembers.size >= voiceChannel.userLimit) {
            ctx.sendMessage(':x: O canal de voz está cheio!');
            player.destroy();
            return;
        }
        player.connect();
      }

      if (player.queue.current) {
        player.queue.clear();
        player.stop();
      }

      player.setTextChannel(ctx.channel.id);
     
      player.queue.add(res.tracks[0]);

      if (!player.playing)
        player.play();

      player.radio = radio[0];

    }catch (err) {
      console.error(err);
      player.destroy();
      ctx.sendMessage(':x: Ocorreu um erro ao tocar a rádio.');
    }
  }
}