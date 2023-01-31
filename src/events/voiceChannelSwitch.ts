import Client from '../structures/Client';

import { Member, TextableChannel, VoiceChannel } from 'oceanic.js';

export default class VoiceChannelIdSwitch {
  client: Client;

  constructor(client: Client) {
    this.client = client;
  }

  async run(member: Member, newChannel: VoiceChannel, oldChannel: VoiceChannel): Promise<void> {
    const player = this.client.music.players.get(member.guild.id);
    if (!player) return;

    const rec = this.client.records.get(oldChannel.id);
    if (rec && member.id === this.client.user.id) {
      clearTimeout(rec.timeout);
      player?.destroy();
      return;
    }

    if (rec) return;

    if (member.id === this.client.user.id) {
      player.voiceChannelId = newChannel.id;

      if (!newChannel.voiceMembers.filter(m => !m.bot).length) {
        player.pause(true);

        const ch = this.client.getChannel(player.textChannelId!) as TextableChannel;
        const timeout = setTimeout(() => {
          ch.createMessage({ content: ':x: Saí do canal de voz porque fiquei sozinho mais de 2 minutos' }).catch(() => { });
          player.destroy();
          this.client.music.channelTimeouts.get(member.guild.id)?.message?.delete().catch(() => { });
          this.client.music.channelTimeouts.delete(member.guild.id);
        }, 2 * 60 * 1000);

        const msg = await ch.createMessage({ content: ':warning: Pausei a música porque fiquei sozinho no canal de voz, se ninguem aparecer irei sair em 2 minutos.' }).catch(() => null);

        this.client.music.channelTimeouts.set(member.guild.id, { timeout, message: msg });
      } else if (this.client.music.channelTimeouts.has(member.guild.id)) {
        player.pause(false);
        const data = this.client.music.channelTimeouts.get(member.guild.id);
        if (!data) return;
        clearTimeout(data.timeout);
        data.message?.delete().catch(() => { });
        this.client.music.channelTimeouts.delete(member.guild.id);
      }
    }

    if (member.bot) return;
    if (oldChannel.id === player.voiceChannelId && !oldChannel.voiceMembers.filter(m => !m.bot).length && newChannel.id !== player.voiceChannelId) {
      player.pause(true);

      const timeout = setTimeout(() => {
        const ch = this.client.getChannel(player.textChannelId!) as TextableChannel;
        ch.createMessage({ content: ':x: Saí do canal de voz porque fiquei sozinho mais de 2 minutos' }).catch(() => { });
        player.destroy();
        this.client.music.channelTimeouts.get(member.guild.id)?.message?.delete().catch(() => { });
        this.client.music.channelTimeouts.delete(member.guild.id);
      }, 2 * 60 * 1000);

      const ch = this.client.getChannel(player.textChannelId!) as TextableChannel;
      const msg = await ch.createMessage({ content: ':warning: Pausei a música porque fiquei sozinho no canal de voz, se ninguem aparecer irei sair em 2 minutos.' }).catch(() => null);

      this.client.music.channelTimeouts.set(member.guild.id, { timeout, message: msg });
      return;
    }

    if (newChannel.id === player.voiceChannelId && this.client.music.channelTimeouts.has(member.guild.id) && newChannel.voiceMembers.filter(m => !m.bot).length) {
      player.pause(false);
      const data = this.client.music.channelTimeouts.get(member.guild.id);
      if (!data) return;
      clearTimeout(data.timeout);
      data.message?.delete().catch(() => { });
      this.client.music.channelTimeouts.delete(member.guild.id);
    }
  }
}