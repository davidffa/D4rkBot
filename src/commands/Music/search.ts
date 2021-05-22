import Command from '../../structures/Command';
import Client from '../../structures/Client';
import CommandContext from '../../structures/CommandContext';
import Filters from '../../structures/Filters';
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
      ctx.sendMessage(':x: Preciso da permissão `Anexar Links` para executar este comando');
      return;
    }

    const currPlayer = this.client.music.players.get(ctx.msg.guildID as string);

    if (!this.client.music.canPlay(ctx, currPlayer)) return;

    const voiceChannelID = ctx.msg.member?.voiceState.channelID as string;
    const voiceChannel = this.client.getChannel(voiceChannelID) as VoiceChannel;

    const createPlayer = (): Player => {
      const player = this.client.music.create({
        guild: ctx.msg.guildID as string,
        voiceChannel: voiceChannelID,
        textChannel: ctx.msg.channel.id,
        selfDeafen: true
      });

      player.filters = new Filters(player);
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

        await ctx.sendMessage({ embed });

        const searchCollector = this.client.music.searchMsgCollectors.get(ctx.author.id);

        if (searchCollector) {
          searchCollector.message.edit({ content: ':x: Pesquisa cancelada!', embed: {} });
          searchCollector.messageCollector.stop('New Search');
          this.client.music.searchMsgCollectors.delete(ctx.author.id);
        }

        const filter = (m: Message) => m.author.id === ctx.author.id && parseInt(m.content) >= 0 && parseInt(m.content) <= resLength;
        const collector = new MessageCollector(this.client, ctx.channel, filter, { max: 1, time: 20000 });

        this.client.music.searchMsgCollectors.set(ctx.author.id, { message: ctx.sentMsg, messageCollector: collector });

        collector.on('collect', m => {
          ctx.sentMsg.delete().catch(() => { });

          const idx = parseInt(m.content);

          if (idx === 0) {
            ctx.sendMessage(':x: Pesquisa cancelada!');
            return;
          }

          const player = currPlayer || createPlayer();

          if (player.radio) {
            player.stop();
            delete player.radio;
          }

          if (player.state === 'DISCONNECTED') {
            if (!voiceChannel.permissionsOf(this.client.user.id).has('manageChannels') && voiceChannel.userLimit && voiceChannel.voiceMembers.size >= voiceChannel.userLimit) {
              ctx.sendMessage(':x: O canal de voz está cheio!');
              player.destroy();
              return;
            }
            player.connect();
          }

          player.queue.add(res.tracks[idx - 1]);

          if (!player.playing)
            player.play()
          else
            ctx.sendMessage(`:bookmark_tabs: Adicionado à lista \`${res.tracks[idx - 1].title}\``);
        });

        collector.on('end', reason => {
          this.client.music.searchMsgCollectors.delete(ctx.author.id);
          if (reason === 'time')
            ctx.editMessage({ content: ':x: Pesquisa cancelada!', embed: {} });
        });
      } else {
        ctx.sendMessage(':x: Não encontrei nenhum resultado!');
      }
    } catch (err) {
      console.error(err);
      ctx.sendMessage(':x: Ocorreu um erro ao procurar a música.');
    }
  }
}