import Command from '../../structures/Command';
import Client from '../../structures/Client';
import CommandContext from '../../structures/CommandContext';

export default class Isitup extends Command {
  constructor(client: Client) {
    super(client, {
      name: 'isitup',
      description: 'Vê se um site está online.',
      args: 1,
      usage: '<URL>',
      category: 'Others',
      cooldown: 4
    });
  }

  async execute(ctx: CommandContext): Promise<void> {
    if (ctx.channel.type === 0 && !ctx.channel.permissionsOf(this.client.user.id).has('embedLinks')) {
      ctx.sendMessage({ content: ':x: Preciso da permissão `Anexar Links` para executar este comando', flags: 1 << 6 });
      return;
    }

    const HTTP = /^[a-zA-Z]+:\/\//
    const PATH = /(\/(.+)?)/g

    const url = ctx.args[0].replace(HTTP, '').replace(PATH, '');

    const body = await this.client.request(`https://isitup.org/${url}.json`).then(res => res.body.json()).catch(_ => null);

    if (!body) {
      ctx.sendMessage({ content: ':x: Site inválido!', flags: 1 << 6 });
      return;
    }

    const embed = new this.client.embed()
      .setColor('RANDOM')
      .setTimestamp()
      .setFooter(`${ctx.author.username}#${ctx.author.discriminator}`, ctx.author.dynamicAvatarURL());

    if (body.response_code) {
      body.response_time *= 1e3;
      embed.setTitle('<:online:804049640437448714> Está Online')
        .setDescription(`O site **${ctx.args[0]}** com o IP **${body.response_ip}** respondeu com o código **${body.response_code}** em **${body.response_time}ms**.`)
    } else {
      embed.setTitle('<:offline:804049815713480715> Está Offline')
        .setDescription(`O site **${ctx.args[0]}** está offline.`)
    }

    ctx.sendMessage({ embeds: [embed] });
  }
}