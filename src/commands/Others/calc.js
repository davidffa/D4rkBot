const { create, all } = require('mathjs');
const { MessageEmbed } = require('discord.js');

module.exports = {
    name: 'calc',
    description: 'Calcula uma expressão matemática',
    aliases: ['calcular', 'calculadora', 'calculate', 'calculator'], 
    category: 'Outros',
    args: 1,
    usage: '<Expressão Matemática>',
    cooldown: 3,
    execute(_client, message, args) {
        const math = create(all);

        const limitedEvaluate = math.evaluate;

        math.import({
            import: function () { throw new Error(':x: A função import está desativada') },
            createUnit: function () { throw new Error(':x: A função createUnit está desativada') },
            evaluate: function () { throw new Error(':x: A função evaluate está desativada') },
            parse: function () { throw new Error(':x: A função parse está desativada') },
            simplify: function () { throw new Error(':x: A função simplify está desativada') },
            derivative: function () { throw new Error(':x: A função derivative está desativada') },
            format: function() { throw new Error(':x: A função format está desativada') },
            zeros: function () { throw new Error(':x: A função zeros está desativada') },
            ones: function () { throw new Error(':x: A função ones está desativada') },
            identity: function() { throw new Error(':x: A função identity está desativada') },
            range: function () { throw new Error(':x: A função range está desativada') },
            matrix: function () { throw new Error(':x: A função matrix está desativada') }
        }, { override: true });

        const expr = args.join(' ').replace(/π/g, 'pi').replace(/÷|:/g, '/').replace(/×/g, '*').replace(/\*\*/g, '^').replace(/"|'|\[|\]|\{|\}/g, '').toLowerCase();
        let result;

        if (expr.length === 0)
            return message.channel.send(':x: Expressão inválida!');

        try {
            result = limitedEvaluate(expr);
        }catch (err) {
            return message.channel.send(':x: Expressão inválida!');
        }

        if (result === Infinity || result === -Infinity || result.toString() === 'NaN') result = 'Impossível determinar';
        if (typeof result === 'function') return message.channel.send(':x: Expressão inválida!');

        const embed = new MessageEmbed()
            .setColor('RANDOM')
            .setTitle('Calculadora')
            .addField(':inbox_tray: Expressão', `\`\`\`${args.join(' ')}\`\`\``)
            .addField(':outbox_tray: Resultado', `\`\`\`${result}\`\`\``)
            .setTimestamp()
            .setFooter(message.author.tag, message.author.displayAvatarURL({ dynamic: true }));
        
        message.channel.send(embed);
    }
}