import Command from '../../structures/Command';
import Client from '../../structures/Client';
import CommandContext from '../../structures/CommandContext';

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

    if (!ctx.channel.permissionsOf(this.client.user.id).has('embedLinks')) {
      ctx.sendMessage(':x: Preciso da permissão `EMBED_LINKS` para executar este comando');
      return;
    }

    if (!ctx.guild.icon) {
      ctx.sendMessage(':x: Este servidor não tem icon.');
      return;
    }

    const url = ctx.guild.dynamicIconURL();

    const embed = new this.client.embed()
      .setTitle(`:frame_photo: Icon do servidor **${ctx.guild.name}**`)
      .setColor('RANDOM')
      .setDescription(`:diamond_shape_with_a_dot_inside: Clique [aqui](${url}) para baixar a imagem!`)
      .setImage(url)
      .setTimestamp()
      .setFooter(`${ctx.author.username}#${ctx.author.discriminator}`, ctx.author.dynamicAvatarURL());

    ctx.sendMessage({ embed });
  }
}