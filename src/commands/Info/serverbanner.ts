import Command from '../../structures/Command';
import Client from '../../structures/Client';
import CommandContext from '../../structures/CommandContext';

export default class Serverbanner extends Command {
  constructor(client: Client) {
    super(client, {
      name: 'serverbanner',
      description: 'Mostra a imagem do banner do servidor.',
      category: 'Info',
      aliases: ['svbanner'],
      cooldown: 3,
    });
  }

  execute(ctx: CommandContext): void {
    if (ctx.channel.type !== 0 || !ctx.guild) return;
    if (!ctx.channel.permissionsOf(this.client.user.id).has('embedLinks')) {
      ctx.channel.createMessage(':x: Preciso da permissão `Anexar Links` para executar este comando');
      return;
    }

    if (!ctx.guild.banner) {
      ctx.sendMessage(':x: Este servidor não tem banner!');
      return;
    }

    const url = ctx.guild.dynamicBannerURL();

    const embed = new this.client.embed()
      .setTitle(`:frame_photo: Banner do servidor **${ctx.guild.name}**`)
      .setColor('RANDOM')
      .setDescription(`:diamond_shape_with_a_dot_inside: Clique [aqui](${url}) para baixar a imagem!`)
      .setImage(url)
      .setTimestamp()
      .setFooter(`${ctx.author.username}#${ctx.author.discriminator}`, ctx.author.dynamicAvatarURL());

    ctx.sendMessage({ embed });
  }
}