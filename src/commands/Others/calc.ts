import Command from '../../structures/Command';
import Client from '../../structures/Client';
import CommandContext from '../../structures/CommandContext';

import { create, all } from 'mathjs';

export default class Calc extends Command {
  constructor(client: Client) {
    super(client, {
      name: 'calc',
      description: 'Calcula uma expressão matemática.',
      args: 1,
      usage: '<Expressão Matemática>',
      category: 'Others',
      dm: true,
      aliases: ['calcular', 'calculadora', 'calculate', 'calculator'],
      cooldown: 3
    });
  }

  execute(ctx: CommandContext) {
    if (ctx.channel.type === 0 && !ctx.channel.permissionsOf(this.client.user.id).has('embedLinks')) {
      ctx.sendMessage(':x: Preciso da permissão `Anexar Links` para executar este comando');
      return;
    }

    const math = create(all);
    const limitedEvaluate = math.evaluate;

    math.import && math.import({
      'import': function () { throw new Error() },
      'createUnit': function () { throw new Error() },
      'evaluate': function () { throw new Error() },
      'parse': function () { throw new Error() },
      'simplify': function () { throw new Error() },
      'derivative': function () { throw new Error() },
      'format': function () { throw new Error() },
      'zeros': function () { throw new Error() },
      'ones': function () { throw new Error() },
      'identity': function () { throw new Error() },
      'range': function () { throw new Error() },
      'matrix': function () { throw new Error() }
    }, { override: true });

    const expr = ctx.args.join(' ').replace(/π/g, 'pi').replace(/÷|:/g, '/').replace(/×/g, '*').replace(/\*\*/g, '^').replace(/"|'|\[|\]|\{|\}/g, '').toLowerCase();
    let result;

    if (!expr.length)
      return ctx.sendMessage({ content: ':x: Expressão inválida!', flags: 1 << 6 });

    try {
      result = limitedEvaluate && limitedEvaluate(expr);
    } catch (err) {
      return ctx.sendMessage({ content: ':x: Expressão inválida!', flags: 1 << 6 });
    }

    if (result === undefined || result === null || typeof result === 'function') return ctx.sendMessage({ content: ':x: Expressão inválida!', flags: 1 << 6 });
    if (result === Infinity || result === -Infinity || result.toString() === 'NaN') result = 'Impossível determinar';

    const embed = new this.client.embed()
      .setColor('RANDOM')
      .setTitle('Calculadora')
      .addField(':inbox_tray: Expressão', `\`\`\`${ctx.args.join(' ')}\`\`\``)
      .addField(':outbox_tray: Resultado', `\`\`\`${result}\`\`\``)
      .setTimestamp()
      .setFooter(`${ctx.author.username}#${ctx.author.discriminator}`, ctx.author.dynamicAvatarURL());

    ctx.sendMessage({ embeds: [embed] });
  }
}