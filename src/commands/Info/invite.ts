import Command from '../../structures/Command';
import Client from '../../structures/Client';

import { Message } from 'eris';

export default class Invite extends Command {
  constructor(client: Client) {
    super(client, {
      name: 'invite',
      description: 'Link do meu convite.',
      aliases: ['inv', 'convite'],
      category: 'Info',
      cooldown: 3,
      dm: true
    });
  }

  execute(message: Message): void {
    const embedRes = [
      '<a:blobdance:804026401849475094> **Adicione-me ao seu servidor usando um dos convites abaixo**\n',
      '[Com permissão de administrador](https://discord.com/oauth2/authorize?client_id=499901597762060288&scope=bot&permissions=8)',
      '[Com todas as permissões necessárias](https://discord.com/oauth2/authorize?client_id=499901597762060288&scope=bot&permissions=1345711190)',
      '[Sem permissões](https://discord.com/oauth2/authorize?client_id=499901597762060288&scope=bot&permissions=0)\n\n',
      '[Servidor de Suporte](https://discord.gg/dBQnxVCTEw)'
    ];

    const res = [
      '<a:blobdance:804026401849475094> **Adicione-me ao seu servidor usando um dos convites abaixo**\n',
      'Com permissão de administrador -> https://discord.com/oauth2/authorize?client_id=499901597762060288&scope=bot&permissions=8',
      'Com todas as permissões necessárias -> https://discord.com/oauth2/authorize?client_id=499901597762060288&scope=bot&permissions=1345711190',
      'Sem permissões -> https://discord.com/oauth2/authorize?client_id=499901597762060288&scope=bot&permissions=0\n\n',
      'Servidor de Suporte -> https://discord.gg/dBQnxVCTEw'
    ]

    const embed = new this.client.embed()
      .setColor('RANDOM')
      .setTitle('Convite')
      .setDescription(embedRes.join('\n'))
      .setFooter(`${message.author.username}#${message.author.discriminator}`, message.author.dynamicAvatarURL())
      .setTimestamp();

    if (message.channel.type === 0 && !message.channel.permissionsOf(this.client.user.id).has('embedLinks')) {
      message.channel.createMessage(res.join('\n'))
    } else {
      message.channel.createMessage({ embed });
    }
  }
}