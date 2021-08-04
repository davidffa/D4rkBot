import Command from '../../structures/Command';
import Client from '../../structures/Client';
import CommandContext from '../../structures/CommandContext';

import Canvas from 'canvas';

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
      ctx.sendMessage(':x: Preciso da permissão `Anexar Links` para executar este comando');
      return;
    }

    if (!ctx.channel.permissionsOf(this.client.user.id).has('attachFiles')) {
      ctx.sendMessage(':x: Preciso da permissão `Anexar Arquivos` para executar este comando');
      return;
    }

    let userID: string | null;

    if (!ctx.args.length) {
      userID = ctx.author.id;
    } else {
      userID = (await this.client.utils.findUser(ctx.args.join(' '), ctx.guild))?.id ?? null;
    }

    if (!userID) {
      ctx.sendMessage(':x: Utilizador não encontrado!');
      return;
    }

    const user: any = await this.client.requestHandler.request('GET', `/users/${userID}`, true);

    if (!user.banner && !user.accent_color) {
      ctx.sendMessage(':x: Esse utilizador não tem banner!');
      return;
    }

    const url = user.banner 
      ? `https://cdn.discordapp.com/banners/${userID}/${user.banner}${user.banner.startsWith('a_') ? '.gif' : '.png'}?size=4096` 
      : 'attachment://banner.png';

    const embed = new this.client.embed()
      .setTitle(`:frame_photo: Banner de ${user.username}#${user.discriminator}`)
      .setColor(user.accent_color ?? 'RANDOM')
      .setImage(url)
      .setTimestamp()
      .setFooter(`${ctx.author.username}#${ctx.author.discriminator}`, ctx.author.dynamicAvatarURL());

    if (user.banner) {
      embed.setDescription(`:diamond_shape_with_a_dot_inside: Clique [aqui](${url}) para baixar a imagem!`);
      ctx.sendMessage({ embed });
    }else {
      const canvas = Canvas.createCanvas(600, 240);
      const canvasCtx = canvas.getContext('2d');

      canvasCtx.fillStyle = `#${(user.accent_color >>> 0).toString(16).padStart(6, '0')}`;
      canvasCtx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.sendMessage({ embed }, {
        name: 'banner.png',
        file: canvas.toBuffer()
      })
    }
  }
}