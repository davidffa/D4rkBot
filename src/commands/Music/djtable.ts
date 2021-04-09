import Command from '../../structures/Command';
import Client from '../../structures/Client';

import { Effect } from '../../typings/index';

import { Emoji, Message, User } from 'eris';
import { ReactionCollector } from '../../structures/Collector';

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

    if (!message.channel.permissionsOf(this.client.user.id).has('embedLinks')) {
      message.channel.createMessage(':x: Preciso da permissão `Anexar Links` para executar este comando');
      return;
    }

    if (!message.channel.permissionsOf(this.client.user.id).has('addReactions')) {
      message.channel.createMessage(':x: Preciso da permissão `Adicionar Reações` para executar este comando');
      return;
    }

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
      if (player.djTableMsg) {
        message.channel.createMessage(':x: Já existe uma mesa de DJ aberta!');
        return;
      }
      const effects: Effect[] = ['bass', 'pop', 'soft', 'treblebass', 'nightcore', 'vaporwave'];

      const embed = new this.client.embed()
        .setTitle('<a:disco:803678643661832233> Mesa de DJ')
        .setColor('RANDOM')
        .setDescription(`**0)** Remove todos os filtros ativos\n\n${effects.map((effect, idx) => `**${idx+1})** ${effect.charAt(0).toUpperCase()}${effect.slice(1)} **[${player.filters.effects.includes(effect) ? '<:on:764478511875751937>' : '<:off:764478504124416040>'}]**`).join('\n')}`)
        .setThumbnail('https://i.pinimg.com/564x/a3/a9/29/a3a929cc8d09e88815b89bc071ff4d8d.jpg')
        .setTimestamp()
        .setFooter(`${message.author.username}#${message.author.discriminator}`, message.author.dynamicAvatarURL());

      const msg = await message.channel.createMessage({ embed });
      player.djTableMsg = msg;
      msg.addReaction('1️⃣');
      msg.addReaction('2️⃣');
      msg.addReaction('3️⃣');
      msg.addReaction('4️⃣');
      msg.addReaction('5️⃣');
      msg.addReaction('6️⃣');
      msg.addReaction('0️⃣');
      msg.addReaction('x_:751062867444498432');

      const filter = (r: Emoji, u: User) => (r.name === '0️⃣' || r.name === '1️⃣' || r.name === '2️⃣' ||
        r.name === '3️⃣' || r.name === '4️⃣' || r.name === '5️⃣' || r.name === '6️⃣' ||r.id === '751062867444498432') && u === message.author;

      const collector = new ReactionCollector(this.client, msg, filter, { max: 20, time: 90000 });

      collector.on('collect', r => {
        switch (r.name) {
          case '0️⃣':
            player.filters.clearFilters();
            embed.setDescription(`**0)** Remove todos os filtros ativos\n\n${effects.map((effect, idx) => `**${idx+1})** ${effect.charAt(0).toUpperCase()}${effect.slice(1)} **[${player.filters.effects.includes(effect) ? '<:on:764478511875751937>' : '<:off:764478504124416040>'}]**`).join('\n')}`);
            msg.edit({ embed });
            break;
          case 'x_':
            collector.stop('Close');
            break;
          default:
            const i = parseInt(r.name.replace(/\uFE0F\u20E3/, ''))
            if (!player.filters.effects.includes(effects[i-1])) {
              player.filters.addEffect(effects[i-1]);
            }else {
              player.filters.removeEffect(effects[i-1]);
            }
    
            embed.setDescription(`**0)** Remove todos os filtros ativos\n\n${effects.map((effect, idx) => `**${idx+1})** ${effect.charAt(0).toUpperCase()}${effect.slice(1)} **[${player.filters.effects.includes(effect) ? '<:on:764478511875751937>' : '<:off:764478504124416040>'}]**`).join('\n')}`);
            msg.edit({ embed });
            break;
        }
      });

      collector.on('remove', r => {
        collector.emit('collect', r, message.author);
      });

      collector.on('end', () => {
        delete player.djTableMsg;

        msg.delete();
        msg.channel.createMessage('<a:disco:803678643661832233> Mesa de DJ fechada!');
      });
    }

    const isDJ = await this.client.music.hasDJRole(member);
    if (this.client.guildCache.get(message.guildID as string)?.djRole) {
      if (isDJ || message.author === player.queue.current?.requester || voiceChannel.voiceMembers.filter(m => !m.bot).length === 1) {
        sendFilterMessage();
        return;
      }
      message.channel.createMessage(':x: Apenas quem requisitou esta música ou alguém com o cargo DJ pode usar a mesa de DJ!');
    } else sendFilterMessage();
  }
}