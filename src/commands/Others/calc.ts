import Command from '../../structures/Command';
import Client from '../../structures/Client';
import Embed from '../../structures/Embed';

import { Message } from 'eris';

import { create, all } from 'mathjs';

class Calc extends Command {
    constructor(client: Client) {
        super(client, {
            name: 'calc',
            description: 'Calcula uma expressão matemática',
            args: 1,
            usage: '<Expressão Matemática>',
            category: 'Others',
            dm: true,
            aliases: ['calcular', 'calculadora', 'calculate', 'calculator'],
            cooldown: 3
        });
    }

    execute(message: Message, args: Array<string>) {
        if (message.channel.type === 0 && !message.channel.permissionsOf(this.client.user.id).has('embedLinks')) {
            message.channel.createMessage(':x: Preciso da permissão `EMBED_LINKS` para executar este comando');
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
            'format': function() { throw new Error() },
            'zeros': function () { throw new Error() },
            'ones': function () { throw new Error() },
            'identity': function() { throw new Error() },
            'range': function () { throw new Error() },
            'matrix': function () { throw new Error() }
        }, { override: true });

        const expr = args.join(' ').replace(/π/g, 'pi').replace(/÷|:/g, '/').replace(/×/g, '*').replace(/\*\*/g, '^').replace(/"|'|\[|\]|\{|\}/g, '').toLowerCase();
        let result;

        if (!expr.length)
            return message.channel.createMessage(':x: Expressão inválida!');

        try {
            result = limitedEvaluate && limitedEvaluate(expr);
        }catch (err) {
            return message.channel.createMessage(':x: Expressão inválida!');
        }

        if (result === null || typeof result === 'function') return message.channel.createMessage(':x: Expressão inválida!');
        if (result === Infinity || result === -Infinity || result.toString() === 'NaN') result = 'Impossível determinar';
    
        const embed = new Embed()
            .setColor('RANDOM')
            .setTitle('Calculadora')
            .addField(':inbox_tray: Expressão', `\`\`\`${args.join(' ')}\`\`\``)
            .addField(':outbox_tray: Resultado', `\`\`\`${result}\`\`\``)
            .setTimestamp()
            .setFooter(`${message.author.username}#${message.author.discriminator}`, message.author.dynamicAvatarURL());

        message.channel.createMessage({ embed });
    }
}

module.exports = Calc;