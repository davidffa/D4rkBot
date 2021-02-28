import Command from '../../structures/Command';
import Client from '../../structures/Client';

import { Message } from 'eris';

export default class Banner extends Command {
    constructor(client: Client) {
        super(client, {
            name: 'banner',
            description: 'Mostra a imagem do banner do servidor',
            category: 'Info',
            aliases: ['serverbanner'],
            cooldown: 3,
        });
    }

    execute(message: Message): void {
        if (message.channel.type !== 0) return;
        if (!message.channel.permissionsOf(this.client.user.id).has('embedLinks')) {
            message.channel.createMessage(':x: Preciso da permissão `EMBED_LINKS` para executar este comando');
            return;
        }

        if (!message.channel.guild.banner) {
            message.channel.createMessage(':x: Este servidor não tem banner!');
            return;
        }

        const url = message.channel.guild.dynamicBannerURL();
        
        const embed = new this.client.embed()
            .setTitle(`:frame_photo: Banner do servidor **${message.channel.guild.name}**`)
            .setColor('RANDOM')
            .setDescription(`:diamond_shape_with_a_dot_inside: Clique [aqui](${url}) para baixar a imagem!`)
            .setImage(url)
            .setTimestamp()
            .setFooter(`${message.author.username}#${message.author.discriminator}`, message.author.dynamicAvatarURL());
    
        message.channel.createMessage({ embed });
    }
}