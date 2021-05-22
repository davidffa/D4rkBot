import Command from '../../structures/Command';
import Client from '../../structures/Client';
import CommandContext from '../../structures/CommandContext';

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

  async execute(ctx: CommandContext): Promise<void> {
    if (ctx.channel.type !== 0) return;

    const player = this.client.music.players.get(ctx.msg.guildID as string);

    if (!player) {
      ctx.sendMessage(':x: Não estou a tocar nada de momento!');
      return;
    }

    if (player.radio) {
      ctx.sendMessage(':x: Não podes usar este comando enquanto estiver a tocar uma rádio!');
      return;
    }

    const voiceChannelID = ctx.msg.member?.voiceState.channelID;

    if (!voiceChannelID || (voiceChannelID && voiceChannelID !== player.voiceChannel)) {
      ctx.sendMessage(':x: Precisas de estar no meu canal de voz para usar esse comando!');
      return;
    }

    const voiceChannel = this.client.getChannel(voiceChannelID);

    if (voiceChannel.type !== 2) return;

    const member = ctx.msg.member;
    if (!member) return;

    const loop = (arg: string): void => {
      if (arg === 'track') {
        player.setTrackRepeat(!player.trackRepeat);

        if (player.trackRepeat)
          ctx.sendMessage('<a:disco:803678643661832233> Música atual em loop!');
        else
          ctx.sendMessage('<a:disco:803678643661832233> Loop da música atual desativado!');
      } else if (arg === 'queue') {
        player.setQueueRepeat(!player.queueRepeat);

        if (player.queueRepeat)
          ctx.sendMessage('<a:disco:803678643661832233> Loop da queue ativado!');
        else
          ctx.sendMessage('<a:disco:803678643661832233> Loop da queue desativado!');
      } else {
        ctx.sendMessage(`:x: **Usa:** \`${this.client.guildCache.get(ctx.msg.guildID as string)?.prefix}loop <track/queue>\``);
      }
    }

    const isDJ = await this.client.music.hasDJRole(member);

    if (this.client.guildCache.get(ctx.msg.guildID as string)?.djRole) {
      if (isDJ || voiceChannel.voiceMembers.filter(m => !m.bot).length === 1) {
        loop(ctx.args[0]);
        return;
      }
      ctx.sendMessage(':x: Apenas alguém com o cargo DJ pode ativar o loop!');
    } else loop(ctx.args[0]);
  }
}