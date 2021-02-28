import Command from '../../structures/Command';
import Client from '../../structures/Client';

import { Message } from 'eris';

export default class Splash extends Command {
    constructor(client: Client) {
        super(client, {
            name: 'splash',
            description: 'Mostra a imagem do splash do servidor',
            category: 'Info',
            aliases: ['serversplash', 'splashimage'],
            cooldown: 3,
        });
    }

    execute(message: Message): void {
        if (message.channel.type !== 0) return;
        if (!message.channel.permissionsOf(this.client.user.id).has('embedLinks')) {
            message.channel.createMessage(':x: Preciso da permissão `EMBED_LINKS` para executar este comando');
            return;
        }

        if (!message.channel.guild.splash) {
            message.channel.createMessage(':x: Este servidor não tem splash!');
            return;
        }

        const url = message.channel.guild.dynamicSplashURL();
        
        const embed = new this.client.embed()
            .setTitle(`:frame_photo: Splash do servidor **${message.channel.guild.name}**`)
            .setColor('RANDOM')
            .setDescription(`:diamond_shape_with_a_dot_inside: Clique [aqui](${url}) para baixar a imagem!`)
            .setImage(url)
            .setTimestamp()
            .setFooter(`${message.author.username}#${message.author.discriminator}`, message.author.dynamicAvatarURL());
    
        message.channel.createMessage({ embed });
    }
}