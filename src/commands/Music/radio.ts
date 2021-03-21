import Command from '../../structures/Command';
import Client from '../../structures/Client';

import { Message } from 'eris';

export default class Radio extends Command {
  constructor(client: Client) {
    super(client, {
      name: 'radio',
      description: 'Toca uma estação de rádio',
      usage: '[Nome da Estação]',
      cooldown: 5,
      category: 'Music'
    });
  }

  async execute(message: Message, args: string[]): Promise<void> {
    if (message.channel.type !== 0) return;
    if (!message.channel.permissionsOf(this.client.user.id).has('embedLinks')) {
      message.channel.createMessage(':x: Preciso da permissão `Anexar Links` para executar este comando');
      return;
    }
    
    const radios = {
      M80: 'https://mcrscast1.mcr.iol.pt/m80',
      CidadeFM: 'https://mcrscast.mcr.iol.pt/cidadefm',
      RFM: 'http://22343.live.streamtheworld.com/RFMAAC_SC',
      RadioComercial: 'https://mcrscast1.mcr.iol.pt/comercial'
    };

    const radio = Object.entries(radios).find(([radio]) => radio.toLowerCase() === args?.join('').toLowerCase());

    if (!radio) {
      const embed = new this.client.embed()
        .setTitle('<a:disco:803678643661832233> Lista de estações de rádio disponíveis')
        .setColor('RANDOM')
        .setDescription(Object.keys(radios).join(', '))
        .setTimestamp()
        .setFooter(`${message.author.username}#${message.author.discriminator}`, message.author.dynamicAvatarURL());

      message.channel.createMessage({ embed });
      return;
    }

    const voiceChannelID = message.member?.voiceState.channelID;
    const currPlayer = this.client.music.players.get(message.guildID as string);
        
    if (!voiceChannelID) {
      message.channel.createMessage(':x: Precisas de estar num canal de voz para executar esse comando!');
      return;
    }

    const voiceChannel = this.client.getChannel(voiceChannelID);
        
    if (voiceChannel.type !== 2) {
      message.channel.createMessage(':x: Ocorreu um erro! `Channel type is not VoiceChannel`');
      return;
    }

    if (currPlayer && voiceChannelID !== currPlayer.voiceChannel) {
      message.channel.createMessage(':x: Precisas de estar no meu canal de voz para usar este comando!');
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
      message.channel.createMessage(':x: Não consigo tocar rádio enquanto gravo voz!')
      return;
    }

    let player = this.client.music.players.get(message.guildID as string);

    if (player && !player.radio) {
      if (this.client.guildCache.get(message.guildID as string)?.djRole) {
        if (voiceChannel.voiceMembers.filter(m => !m.bot).length !== 1
          && (message.member && !await this.client.music.hasDJRole(message.member) && !voiceChannel.permissionsOf(message.member).has('voiceMoveMembers'))) {
            message.channel.createMessage(':x: Apenas quem requisitou todas as músicas da queue, alguém com o cargo DJ ou alguém com a permissão `Mover Membros` pode usar este comando!');
            return;
        }
      }
    }else {
      player = this.client.music.create({
        guild: message.guildID as string,
        voiceChannel: voiceChannelID,
        textChannel: message.channel.id,
        selfDeafen: true
      })
    }

    try {
      const res = await this.client.music.search(radio[1], message.author);

      if (res.loadType !== 'TRACK_LOADED') {
        message.channel.createMessage(':x: Ocorreu um erro ao tocar a rádio.');
        player.destroy();
        return;
      }

      if (player.state === 'DISCONNECTED') {
        if (!voiceChannel.permissionsOf(this.client.user.id).has('manageChannels') 
          && voiceChannel.userLimit && voiceChannel.voiceMembers.size >= voiceChannel.userLimit) {
            message.channel.createMessage(':x: O canal de voz está cheio!');
            player.destroy();
            return;
        }
        player.connect();
      }

      if (player.queue.current) {
        player.queue.clear();
        player.stop();
      }
     
      player.queue.add(res.tracks[0]);

      if (!player.playing)
        player.play();

      player.radio = radio[0];

    }catch (err) {
      console.error(err);
      player.destroy();
      message.channel.createMessage(':x: Ocorreu um erro ao tocar a rádio.');
    }
  }
}