import Command from '../../structures/Command';
import Client from '../../structures/Client';

import { Message, User } from 'eris';

export default class Avatar extends Command {
    constructor(client: Client) {
        super(client, {
            name: 'avatar',
            description: 'Mostra o teu avatar ou de outra pessoa em uma imagem grande',
            category: 'Info',
            aliases: ['av'],
            dm: true,
            usage: '[nome]',
        });
    }

    async execute(message: Message, args: Array<string>): Promise<void> {
        if (message.channel.type === 0 && !message.channel.permissionsOf(this.client.user.id).has('embedLinks')) {
            message.channel.createMessage(':x: Preciso da permissão `Anexar Links` para executar este comando');
            return;
        }

        let user: User;
    
        if (!args.length || message.channel.type === 1) {
            user = message.author;
        }else {
            user = message.mentions[0] || 
                (message.channel.type === 0 && await this.client.utils.findUser(args.join(' '), message.channel.guild));
        }

        if (!user) {
            message.channel.createMessage(':x: Utilizador não encontrado!');
            return;
        }

        const url = user.dynamicAvatarURL();

        const embed = new this.client.embed()
            .setTitle(`:frame_photo: Avatar de ${user.username}#${user.discriminator}`)
            .setColor('RANDOM')
            .setDescription(`:diamond_shape_with_a_dot_inside: Clique [aqui](${url}) para baixar a imagem!`)
            .setImage(url)
            .setTimestamp()
            .setFooter(`${message.author.username}#${message.author.discriminator}`, message.author.dynamicAvatarURL());
        
        message.channel.createMessage({ embed });
    }
}