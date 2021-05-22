import Command from '../../structures/Command';
import Client from '../../structures/Client';
import CommandContext from '../../structures/CommandContext';

import { User, Message } from 'eris';

export default class Avatar extends Command {
  constructor(client: Client) {
    super(client, {
      name: 'avatar',
      description: 'Mostra o teu avatar ou de outra pessoa em uma imagem grande.',
      category: 'Info',
      aliases: ['av'],
      dm: true,
      usage: '[nome]',
    });
  }

  async execute(ctx: CommandContext): Promise<void> {
    if (ctx.channel.type === 0 && !ctx.channel.permissionsOf(this.client.user.id).has('embedLinks')) {
      ctx.sendMessage(':x: Preciso da permissão `Anexar Links` para executar este comando');
      return;
    }

    let user: User | null;

    if (!ctx.args.length || ctx.channel.type === 1) {
      user = ctx.author;
    } else {
      user = (ctx.msg instanceof Message && ctx.msg.mentions[0]) ||
        (ctx.guild && await this.client.utils.findUser(ctx.args.join(' '), ctx.guild));
    }

    if (!user) {
      ctx.sendMessage(':x: Utilizador não encontrado!');
      return;
    }

    const url = user.dynamicAvatarURL();

    const embed = new this.client.embed()
      .setTitle(`:frame_photo: Avatar de ${user.username}#${user.discriminator}`)
      .setColor('RANDOM')
      .setDescription(`:diamond_shape_with_a_dot_inside: Clique [aqui](${url}) para baixar a imagem!`)
      .setImage(url)
      .setTimestamp()
      .setFooter(`${ctx.author.username}#${ctx.author.discriminator}`, ctx.author.dynamicAvatarURL());

    ctx.sendMessage({ embed });
  }
}