import Command from '../../structures/Command';
import Client from '../../structures/Client';

import { Message } from 'eris';

export default class Ping extends Command {
    constructor(client: Client) {
        super(client, {
            name: 'ping',
            description: 'Mostra o meu ping, o da API e o da Base de dados',
            category: 'Info',
            aliases: ['latencia', 'latency'],
            dm: true,
            cooldown: 4
        });
    }

    async execute(message: Message) {
        const startMsg = process.hrtime();
        const m = await message.channel.createMessage('A calcular...');
        const stopMsg = process.hrtime(startMsg);

        const startDB = process.hrtime();
        await this.client.botDB.findOne({ botID: this.client.user.id });
        const stopDB = process.hrtime(startDB);

        const pingMsg = Math.round(((stopMsg[0] * 1e9) + stopMsg[1]) / 1e6);
        const pingDB = Math.round(((stopDB[0] * 1e9) + stopDB[1]) / 1e6);
        const WSPing = this.client.shards.get(0)?.latency || 0;

        const res = [
            `<:bot:804028762307821578> \`${pingMsg}ms\``,
            `:stopwatch: \`${Math.round(WSPing)}ms\``,
            `<:MongoDB:773610222602158090> \`${pingDB}ms\``
        ]

        const embed = new this.client.embed()
            .setTitle('🏓 Pong')
            .setColor('RANDOM')
            .setDescription(res.join('\n'))
            .setFooter(`${message.author.username}#${message.author.discriminator}`, message.author.dynamicAvatarURL())
            .setTimestamp();

        if (message.channel.type === 0) {
            if (message.channel.permissionsOf(this.client.user.id).has('embedLinks')) {
                m.edit({ content: '', embed });
            }else {
                m.edit(res.join('\n'));
            }
        } 
    }
}