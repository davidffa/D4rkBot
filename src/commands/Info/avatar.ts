import Command from '../../structures/Command';
import Client from '../../structures/Client';
import CommandContext from '../../structures/CommandContext';

import { ActionRow, ActionRowComponents, ComponentInteraction, Message, User } from 'eris';
import { ComponentCollector } from '../../structures/Collector';

export default class Avatar extends Command {
  constructor(client: Client) {
    super(client, {
      name: 'avatar',
      description: 'Mostra o teu avatar ou de outra pessoa em uma imagem grande.',
      category: 'Info',
      aliases: ['av'],
      usage: '[nome]',
    });
  }

  async execute(ctx: CommandContext): Promise<void> {
    if (ctx.channel.type === 0 && !ctx.channel.permissionsOf(this.client.user.id).has('embedLinks')) {
      ctx.sendMessage({ content: ':x: Preciso da permissão `Anexar Links` para executar este comando', flags: 1 << 6 });
      return;
    }

    let user: User | null;

    if (!ctx.args.length || ctx.channel.type === 1) {
      user = ctx.author;
    } else {
      user = await this.client.utils.findUser(ctx.args.join(' '), ctx.guild)
    }

    if (!user) {
      ctx.sendMessage({ content: ':x: Utilizador não encontrado!', flags: 1 << 6 });
      return;
    }

    const userUrl = user.dynamicAvatarURL();

    const userEmbed = new this.client.embed()
      .setTitle(`:frame_photo: Avatar de ${user.username}#${user.discriminator}`)
      .setColor('RANDOM')
      .setDescription(`:diamond_shape_with_a_dot_inside: Clique [aqui](${userUrl}) para baixar a imagem!`)
      .setImage(userUrl)
      .setTimestamp()
      .setFooter(`${ctx.author.username}#${ctx.author.discriminator}`, ctx.author.dynamicAvatarURL());

    const member = ctx.guild.members.get(user.id);

    if (!member || !member.avatar) {
      ctx.sendMessage({ embeds: [userEmbed] });
      return;
    }

    const memberUrl = member.avatarURL;

    const memberEmbed = new this.client.embed()
      .setTitle(`:frame_photo: Avatar de ${user.username}#${user.discriminator} neste servidor`)
      .setColor('RANDOM')
      .setDescription(`:diamond_shape_with_a_dot_inside: Clique [aqui](${memberUrl}) para baixar a imagem!`)
      .setImage(memberUrl)
      .setTimestamp()
      .setFooter(`${ctx.author.username}#${ctx.author.discriminator}`, ctx.author.dynamicAvatarURL());

    const components: ActionRowComponents[] = [
      {
        custom_id: 'left',
        style: 2,
        type: 2,
        emoji: {
          name: '⬅️'
        },
        disabled: true
      },
      {
        custom_id: 'right',
        style: 2,
        type: 2,
        emoji: {
          name: '➡️'
        }
      }
    ]

    const row: ActionRow = {
      type: 1,
      components
    }

    const msg = await ctx.sendMessage({ embeds: [memberEmbed], components: [row] }, true) as Message;

    const filter = (i: ComponentInteraction) => i.member!.id === ctx.author.id;

    const collector = new ComponentCollector(this.client, msg, filter, { time: 3 * 60 * 1000 });

    collector.on('collect', i => {
      if (i.data.custom_id === 'left') {
        row.components[0].disabled = true;
        row.components[1].disabled = false;
        i.editParent({ embeds: [memberEmbed], components: [row] });
      } else {
        row.components[0].disabled = false;
        row.components[1].disabled = true;
        i.editParent({ embeds: [userEmbed], components: [row] });
      }
    });

    collector.on('end', (r) => {
      if (r === 'Time')
        msg.edit({ components: [] });
    });
  }
}