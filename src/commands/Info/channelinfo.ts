import Command from '../../structures/Command';
import Client from '../../structures/Client';

import { Message } from 'eris';

export default class Channelinfo extends Command {
    constructor(client: Client) {
        super(client, {
            name: 'channelinfo',
            description: 'Mostra informações sobre um canal de voz do servidor',
            category: 'Info',
            aliases: ['chinfo'],
            usage: '[ID do canal/Nome]',
            cooldown: 4
        });
    }

    async execute(message: Message, args: Array<string>): Promise<void> {
        if (message.channel.type !== 0 || !message.channel.permissionsOf(this.client.user.id).has('embedLinks')) {
            message.channel.createMessage(':x: Preciso da permissão `Anexar Links` para executar este comando.');
            return;
        }

        const channel = args.length ? (message.channel.guild.channels.get(args[0])
            || message.channel.guild.channels.find(ch => ch.name.includes(args.join(' ')))) : message.channel;

        if (!channel) {
            message.channel.createMessage(':x: Canal não encontrado!');
            return;
        }
        
        const channelTypes = {
            0: 'Texto',
            2: 'Voz',
            4: 'Categoria',
            5: 'Anúncios',
            6: 'Loja'
        }

        const embed = new this.client.embed()
            .setTitle('Channel Info')
            .setColor('RANDOM')
            .addField(':id: ID', `\`${channel.id}\``, true)
            .addField(':newspaper: Nome', `\`${channel.name}\``, true)
            .addField(':diamond_shape_with_a_dot_inside: Tipo', `\`${channelTypes[channel.type]}\``, true)
            .addField(':underage: NSFW', `\`${channel.nsfw ? 'Sim' : 'Não'}\``, true)
            .addField(':trophy: Posição', `\`${channel.position}\``, true)
            .setFooter(`${message.author.username}#${message.author.discriminator}`, message.author.dynamicAvatarURL())
            .setTimestamp();

        channel.parentID && embed.addField(':flag_white: Categoria', `\`${message.channel.guild.channels.get(channel.parentID)?.name}\``, true)
        message.channel.createMessage({ embed });
    }
}