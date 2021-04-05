import Command from '../../structures/Command';
import Client from '../../structures/Client';

import { Message } from 'eris';

export default class Loop extends Command {
  constructor(client: Client) {
    super(client, {
      name: 'loop',
      description: 'Repete a queue ou a música atual.',
      category: 'Music',
      aliases: ['repeat'],
      cooldown: 4,
      args: 1,
      usage: '<track/queue>',
    });
  }

  async execute(message: Message, args: Array<string>): Promise<void> {
    if (message.channel.type !== 0) return;

    const player = this.client.music.players.get(message.guildID as string);

    if (!player) {
      message.channel.createMessage(':x: Não estou a tocar nada de momento!');
      return;
    }

    if (player.radio) {
      message.channel.createMessage(':x: Não podes usar este comando enquanto estiver a tocar uma rádio!');
      return;
    }

    const voiceChannelID = message.member?.voiceState.channelID;

    if (!voiceChannelID || (voiceChannelID && voiceChannelID !== player.voiceChannel)) {
      message.channel.createMessage(':x: Precisas de estar no meu canal de voz para usar esse comando!');
      return;
    }

    const voiceChannel = this.client.getChannel(voiceChannelID);

    if (voiceChannel.type !== 2) return;

    const member = message.member;
    if (!member) return;

    const loop = (arg: string): void => {
      if (arg === 'track') {
        player.setTrackRepeat(!player.trackRepeat);

        if (player.trackRepeat)
          message.channel.createMessage('<a:disco:803678643661832233> Música atual em loop!');
        else
          message.channel.createMessage('<a:disco:803678643661832233> Loop da música atual desativado!');
      } else if (arg === 'queue') {
        player.setQueueRepeat(!player.queueRepeat);

        if (player.queueRepeat)
          message.channel.createMessage('<a:disco:803678643661832233> Loop da queue ativado!');
        else
          message.channel.createMessage('<a:disco:803678643661832233> Loop da queue desativado!');
      } else {
        message.channel.createMessage(`:x: **Usa:** \`${this.client.guildCache.get(message.guildID as string)?.prefix}loop <track/queue>\``);
      }
    }

    const isDJ = await this.client.music.hasDJRole(member);

    if (this.client.guildCache.get(message.guildID as string)?.djRole) {
      if (isDJ || voiceChannel.voiceMembers.filter(m => !m.bot).length === 1) {
        loop(args[0]);
        return;
      }
      message.channel.createMessage(':x: Apenas alguém com o cargo DJ pode ativar o loop!');
    } else loop(args[0]);
  }
}