import Command from '../../structures/Command';
import Client from '../../structures/Client';
import CommandContext from '../../structures/CommandContext';

import fetch from 'node-fetch';
import cio from 'cheerio';

export default class Currency extends Command {
  constructor(client: Client) {
    super(client, {
      name: 'currency',
      description: 'Conversor de moeda.',
      args: 3,
      usage: '<de> <para> <valor>',
      category: 'Others',
      dm: true,
      aliases: ['moeda', 'curr', 'conversormoeda', 'currconverter'],
      cooldown: 3
    });
  }

  async execute(ctx: CommandContext): Promise<void> {
    if (ctx.channel.type === 0 && !ctx.channel.permissionsOf(this.client.user.id).has('embedLinks')) {
      ctx.sendMessage(':x: Preciso da permissão `Anexar Links` para executar este comando');
      return;
    }

    if (isNaN(parseFloat(ctx.args[2]))) {
      ctx.sendMessage(':x: Valor inválido.');
      return;
    }

    ctx.args[0] = ctx.args[0].toUpperCase();
    ctx.args[1] = ctx.args[1].toUpperCase();

    const res = await fetch(`https://www.x-rates.com/calculator/?from=${ctx.args[0]}&to=${ctx.args[1]}&amount=${ctx.args[2]}`).then(res => res.text());

    const $ = cio.load(res);

    const value = $('span[class="ccOutputRslt"]').text();

    if (value.endsWith('---')) {
      ctx.sendMessage(':x: Formato da moeda inválido! Tente `USD, EUR, BRL, ...`');
      return;
    }

    const embed = new this.client.embed()
      .setColor('RANDOM')
      .setDescription(`Fonte: [x-rates](https://www.x-rates.com/calculator/?from=${ctx.args[0]}&to=${ctx.args[1]}&amount=${ctx.args[2]})`)
      .setTitle('Conversor de Moeda')
      .addField(`:moneybag: Valor de origem: (${ctx.args[0]})`, `\`\`\`\n${ctx.args[2]}\`\`\``)
      .addField(`:moneybag: Valor convertido: (${ctx.args[1]})`, `\`\`\`\n${value.split(' ')[0]}\`\`\``)
      .setTimestamp()
      .setFooter(`${ctx.author.username}#${ctx.author.discriminator}`, ctx.author.dynamicAvatarURL());

    ctx.sendMessage({ embed });
  }
}