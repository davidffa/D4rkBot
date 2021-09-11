import Command from '../../structures/Command';
import Client from '../../structures/Client';
import CommandContext from '../../structures/CommandContext';
import { MessageCollector } from '../../structures/Collector';

import { Message, VoiceChannel } from 'eris';

import { Player } from 'erela.js';

export default class Search extends Command {
  constructor(client: Client) {
    super(client, {
      name: 'search',
      description: 'Procura uma música no YouTube e toca-a.',
      category: 'Music',
      aliases: ['procurar', 'searchmusic'],
      cooldown: 5,
      usage: '<Nome>',
      args: 1
    });
  }

  async execute(ctx: CommandContext): Promise<void> {
    if (ctx.channel.type !== 0) return;
    if (!ctx.channel.permissionsOf(this.client.user.id).has('embedLinks')) {
      ctx.sendMessage({ content: ':x: Preciso da permissão `Anexar Links` para executar este comando', flags: 1 << 6 });
      return;
    }

    const currPlayer = this.client.music.players.get(ctx.guild.id);

    if (!this.client.music.canPlay(ctx, currPlayer)) return;

    const voiceChannelID = ctx.member?.voiceState.channelID as string;
    const voiceChannel = this.client.getChannel(voiceChannelID) as VoiceChannel;

    const createPlayer = (): Player => {
      const player = this.client.music.create({
        guild: ctx.guild.id,
        voiceChannel: voiceChannelID,
        textChannel: ctx.channel.id,
        selfDeafen: true
      });

      player.effects = [];
      return player;
    }

    try {
      const res = await this.client.music.search(ctx.args.join(' '), ctx.author);

      if (res.loadType === 'SEARCH_RESULT') {
        const resLength = res.tracks.length >= 10 ? 10 : res.tracks.length;
        let desc = '';

        for (let i = 1; i <= resLength; i++) {
          desc += `${i}º - \`${res.tracks[i - 1].title}\`\n`;
        }

        desc += `Envie mensagem com o número da música, (0 para cancelar)`;

        const embed = new this.client.embed()
          .setColor('RANDOM')
          .setTitle(':bookmark_tabs: Resultados da procura')
          .setDescription(desc)
          .setAuthor(`${ctx.author.username}#${ctx.author.discriminator}`, ctx.author.dynamicAvatarURL())
          .setTimestamp();

        const msg = await ctx.sendMessage({ embeds: [embed] }, true) as Message;

        const searchCollector = this.client.music.searchMsgCollectors.get(ctx.author.id);

        if (searchCollector) {
          searchCollector.message.edit({ content: ':x: Pesquisa cancelada!', embeds: [] });
          searchCollector.messageCollector.stop('New Search');
          this.client.music.searchMsgCollectors.delete(ctx.author.id);
        }

        const filter = (m: Message) => m.author.id === ctx.author.id && parseInt(m.content) >= 0 && parseInt(m.content) <= resLength;
        const collector = new MessageCollector(this.client, ctx.channel, filter, { max: 1, time: 20000 });

        this.client.music.searchMsgCollectors.set(ctx.author.id, { message: msg, messageCollector: collector });

        collector.on('collect', m => {
          msg.delete().catch(() => { });

          const idx = parseInt(m.content);

          if (idx === 0) {
            ctx.channel.createMessage(':x: Pesquisa cancelada!');
            return;
          }

          const player = currPlayer || createPlayer();

          if (player.radio) {
            player.stop();
            delete player.radio;
          }

          if (player.state === 'DISCONNECTED') {
            if (!voiceChannel.permissionsOf(this.client.user.id).has('manageChannels') && voiceChannel.userLimit && voiceChannel.voiceMembers.size >= voiceChannel.userLimit) {
              ctx.channel.createMessage({ content: ':x: O canal de voz está cheio!', flags: 1 << 6 });
              player.destroy();
              return;
            }
            player.connect();
          }

          player.queue.add(res.tracks[idx - 1]);

          if (!player.playing)
            player.play()
          else
            ctx.channel.createMessage(`:bookmark_tabs: Adicionado à lista \`${res.tracks[idx - 1].title}\``);
        });

        collector.on('end', reason => {
          this.client.music.searchMsgCollectors.delete(ctx.author.id);
          if (reason === 'time')
            msg.edit({ content: ':x: Pesquisa cancelada!', embeds: [] });
        });
      } else {
        ctx.channel.createMessage({ content: ':x: Não encontrei nenhum resultado!', flags: 1 << 6 });
      }
    } catch (err) {
      console.error(err);
      ctx.channel.createMessage({ content: ':x: Ocorreu um erro ao procurar a música.', flags: 1 << 6 });
    }
  }
}