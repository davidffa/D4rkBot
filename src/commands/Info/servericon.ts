import Command from '../../structures/Command';
import Client from '../../structures/Client';
import CommandContext from '../../structures/CommandContext';
import { Guild } from 'oceanic.js';
import { dynamicAvatar } from '../../utils/dynamicAvatar';

export default class Servericon extends Command {
  constructor(client: Client) {
    super(client, {
      name: 'servericon',
      description: 'Mostra o icon do servidor em uma imagem grande.',
      aliases: ['serveravatar', 'serverimage'],
      category: 'Info',
      cooldown: 3,
    });
  }

  execute(ctx: CommandContext): void {
    if (ctx.channel.type !== 0 || !ctx.guild) return;

    if (!ctx.channel.permissionsOf(this.client.user.id).has('EMBED_LINKS')) {
      ctx.sendMessage({ content: ':x: Preciso da permissão `Anexar Embeds` para executar este comando', flags: 1 << 6 });
      return;
    }

    if (!ctx.guild.icon) {
      ctx.sendMessage({ content: ':x: Este servidor não tem icon.', flags: 1 << 6 });
      return;
    }

    const url = Servericon.dynamicIcon(ctx.guild)!;

    const embed = new this.client.embed()
      .setTitle(`:frame_photo: Icon do servidor **${ctx.guild.name}**`)
      .setColor('RANDOM')
      .setDescription(`:diamond_shape_with_a_dot_inside: Clique [aqui](${url}) para baixar a imagem!`)
      .setImage(url)
      .setTimestamp()
      .setFooter(`${ctx.author.username}#${ctx.author.discriminator}`, dynamicAvatar(ctx.author));

    ctx.sendMessage({ embeds: [embed] });
  }

  static dynamicIcon(guild: Guild) {
    if (guild.icon) {
      if (guild.icon.startsWith('a_')) {
        return guild.iconURL('gif');
      }
      return guild.iconURL();
    }
  }
}