import Command from '../../structures/Command';
import Client from '../../structures/Client';

import { Effect } from '../../typings/index';

import { Emoji, Message, User } from 'eris';
import { MessageCollector, ReactionCollector } from '../../structures/Collector';

export default class Djtable extends Command {
  constructor(client: Client) {
    super(client, {
      name: 'djtable',
      description: 'Adiciona efeitos na música que está a tocar',
      category: 'Music',
      aliases: ['soundeffects', 'efeitos', 'filters', 'soundfilters', 'effects', 'mesadj'],
      cooldown: 5,
    });
  }

  async execute(message: Message): Promise<void> {
    if (message.channel.type !== 0) return;

    const player = this.client.music.players.get(message.guildID as string);

    if (!player) {
      message.channel.createMessage(':x: Não estou a tocar nada de momento!');
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

    const sendFilterMessage = async (): Promise<void> => {
      if (player.djTableOpen) {
        message.channel.createMessage(':x: Já existe uma mesa de DJ aberta!');
        return;
      }

      player.djTableOpen = true;
      const effects: Effect[] = ['bass', 'pop', 'soft', 'treblebass', 'nightcore', 'vaporwave'];

      const embed = new this.client.embed()
        .setTitle('<a:disco:803678643661832233> Mesa de DJ')
        .setColor('RANDOM')
        .setDescription(`**0)** Remove todos os filtros ativos\n\n${effects.map((effect, idx) => `**${idx+1})** ${effect.charAt(0).toUpperCase()}${effect.slice(1)} **[${player.filters.effects.includes(effect) ? 'ON' : 'OFF'}]**`).join('\n')}\n\n\nReage no <:x_:751062867444498432> para fechar a mesa de DJ`)
        .setTimestamp()
        .setFooter(`${message.author.username}#${message.author.discriminator}`, message.author.dynamicAvatarURL());

      const m = await message.channel.createMessage({ embed });
      m.addReaction('x_:751062867444498432');

      const filter = (m: Message) => m.author.id === message.author.id && parseInt(m.content) >= 0 && parseInt(m.content) <= 6;
      const collector = new MessageCollector(this.client, message.channel, filter, { max: 10, time: 30000 });

      const reactFilter = (r: Emoji, u: User) => (r.id === '751062867444498432') && u === message.author;
      const reactCollector = new ReactionCollector(this.client, m, reactFilter, { max: 1 });
      
      collector.on('collect', msg => {
        const i = parseInt(msg.content);
        if (i === 0) {
          player.filters.clearFilters();
          embed.setDescription(`**0)** Remove todos os filtros ativos\n\n${effects.map((effect, idx) => `**${idx+1})** ${effect.charAt(0).toUpperCase()}${effect.slice(1)} **[${player.filters.effects.includes(effect) ? 'ON' : 'OFF'}]**`).join('\n')}\n\n\nReage no <:x_:751062867444498432> para fechar a mesa de DJ`);
          m.edit({ embed });
          message.channel.createMessage('<a:disco:803678643661832233> Filtros removidos!');
          return;
        }

        if (!player.filters.effects.includes(effects[i-1])) {
          player.filters.addEffect(effects[i-1]);
          message.channel.createMessage(`<a:disco:803678643661832233> Efeito ${effects[i-1]} adicionado!`);
        }else {
          player.filters.removeEffect(effects[i-1]);
          message.channel.createMessage(`<a:disco:803678643661832233> Efeito ${effects[i-1]} removido!`);
        }

        embed.setDescription(`**0)** Remove todos os filtros ativos\n\n${effects.map((effect, idx) => `**${idx+1})** ${effect.charAt(0).toUpperCase()}${effect.slice(1)} **[${player.filters.effects.includes(effect) ? 'ON' : 'OFF'}]**`).join('\n')}\n\n\nReage no <:x_:751062867444498432> para fechar a mesa de DJ`);
        m.edit({ embed });
      });

      collector.on('end', reason => {
        if (reason === 'Force') return;
        m.edit({ content: '<a:disco:803678643661832233> Mesa de DJ fechada!', embed: {} });
        delete player.djTableOpen;
        reactCollector.stop();
        m.removeReaction('x_:751062867444498432', this.client.user.id);
      });

      reactCollector.on('collect', () => {
        collector.stop('Force');
        m.edit({ content: '<a:disco:803678643661832233> Mesa de DJ fechada!', embed: {} });
        delete player.djTableOpen;
        m.removeReaction('x_:751062867444498432', this.client.user.id);
      });
    }

    const isDJ = await this.client.music.hasDJRole(member);
    if (this.client.guildCache.get(message.guildID as string)?.djRole) {
      if (isDJ || message.author === player.queue.current?.requester || voiceChannel.voiceMembers.filter(m => !m.bot).length === 1) {
        sendFilterMessage();
        return;
      }
      message.channel.createMessage(':x: Apenas quem requisitou esta música ou alguém com o cargo DJ pode usar a mesa de DJ na música!');
    } else sendFilterMessage();
  }
}