import Command from '../../structures/Command';
import Client from '../../structures/Client';
import CommandContext from '../../structures/CommandContext';

export default class Splash extends Command {
  constructor(client: Client) {
    super(client, {
      name: 'splash',
      description: 'Mostra a imagem do splash do servidor.',
      category: 'Info',
      aliases: ['serversplash', 'splashimage'],
      cooldown: 3,
    });
  }

  execute(ctx: CommandContext): void {
    if (ctx.channel.type !== 0 || !ctx.guild) return;
    if (!ctx.channel.permissionsOf(this.client.user.id).has('embedLinks')) {
      ctx.sendMessage({ content: ':x: Preciso da permissão `Anexar Links` para executar este comando', flags: 1 << 6 });
      return;
    }

    if (!ctx.guild.splash) {
      ctx.sendMessage({ content: ':x: Este servidor não tem splash!', flags: 1 << 6 });
      return;
    }

    const url = ctx.guild.dynamicSplashURL()!;

    const embed = new this.client.embed()
      .setTitle(`:frame_photo: Splash do servidor **${ctx.guild.name}**`)
      .setColor('RANDOM')
      .setDescription(`:diamond_shape_with_a_dot_inside: Clique [aqui](${url}) para baixar a imagem!`)
      .setImage(url)
      .setTimestamp()
      .setFooter(`${ctx.author.username}#${ctx.author.discriminator}`, ctx.author.dynamicAvatarURL());

    ctx.sendMessage({ embeds: [embed] });
  }
}