import Command from '../../structures/Command';
import Client from '../../structures/Client';
import CommandContext from '../../structures/CommandContext';

import Canvas from 'canvas';
import { getColorFromURL } from 'color-thief-node';

export default class Banner extends Command {
  constructor(client: Client) {
    super(client, {
      name: 'banner',
      description: 'Mostra a imagem do banner de alguém.',
      category: 'Info',
      aliases: ['userbanner'],
      cooldown: 3,
    });
  }

  async execute(ctx: CommandContext): Promise<void> {
    if (ctx.channel.type !== 0) return;
    if (!ctx.channel.permissionsOf(this.client.user.id).has('embedLinks')) {
      ctx.sendMessage({ content: ':x: Preciso da permissão `Anexar Links` para executar este comando', flags: 1 << 6 });
      return;
    }

    if (!ctx.channel.permissionsOf(this.client.user.id).has('attachFiles')) {
      ctx.sendMessage({ content: ':x: Preciso da permissão `Anexar Arquivos` para executar este comando', flags: 1 << 6 });
      return;
    }

    const user = !ctx.args.length ? ctx.author : await this.client.utils.findUser(ctx.args.join(' '), ctx.guild)

    if (!user) {
      ctx.sendMessage({ content: ':x: Utilizador não encontrado!', flags: 1 << 6 });
      return;
    }

    let dominant = false;

    if (user.banner === undefined) {
      this.client.users.update((await this.client.getRESTUser(user.id)));
    }

    if (!user.banner && !user.accentColor) {
      const [r, g, b] = await getColorFromURL(user.dynamicAvatarURL());
      user.accentColor = r << 16 | g << 8 | b;
      dominant = true;
    }

    const url = user.banner
      ? user.dynamicBannerURL()!
      : 'attachment://banner.png';

    const embed = new this.client.embed()
      .setTitle(`:frame_photo: Banner de ${user.username}#${user.discriminator}`)
      .setColor(user.accentColor ?? 'RANDOM')
      .setImage(url)
      .setTimestamp()
      .setFooter(`${ctx.author.username}#${ctx.author.discriminator}`, ctx.author.dynamicAvatarURL());

    dominant && embed.setDescription("OBS: A cor deste banner poderá não corresponder à cor original.")

    if (user.banner) {
      embed.setDescription(`:diamond_shape_with_a_dot_inside: Clique [aqui](${url}) para baixar a imagem!`);
      ctx.sendMessage({ embeds: [embed] });
    } else {
      const canvas = Canvas.createCanvas(600, 240);
      const canvasCtx = canvas.getContext('2d');

      canvasCtx.fillStyle = `#${(user.accentColor! >>> 0).toString(16).padStart(6, '0')}`;
      canvasCtx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.sendMessage({
        embeds: [embed],
        file: [
          {
            name: 'banner.png',
            file: canvas.toBuffer()
          }
        ]
      })
    }
  }
}