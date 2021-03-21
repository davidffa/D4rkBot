import Command from '../../structures/Command';
import Client from '../../structures/Client';

import { Message } from 'eris';

import moment from 'moment';
moment.locale('pt');

export default class RoleInfo extends Command {
  constructor(client: Client) {
    super(client, {
      name: 'roleinfo',
      description: 'Informação sobre um cargo no servidor',
      usage: '<Cargo>',
      args: 1,
      cooldown: 4,
      category: 'Info'
    });
  }

  execute(message: Message, args: string[]): void {
    if (message.channel.type !== 0) return;

    if (!message.channel.permissionsOf(this.client.user.id).has('embedLinks')) {
      message.channel.createMessage(':x: Preciso da permissão `Anexar Links` para executar este comando');
      return;
    }

    const role = message.channel.guild.roles.get(args[0])
      || message.channel.guild.roles.find(r => r.name === args[0])
      || message.channel.guild.roles.find(r => r.name.includes(args[0]))
      || message.channel.guild.roles.find(r => r.name.toLowerCase().includes(args[0].toLowerCase()));

    if (!role) {
      message.channel.createMessage(':x: Cargo não encontrado!');
      return;
    }

    const embed = new this.client.embed()
      .setTitle(`Informações do cargo ${role.name}`)
      .addField(':id: ID', `\`${role.id}\``, true)
      .addField(':calendar: Criado em', `\`${moment(role.createdAt).format('L')} (${moment(role.createdAt).startOf('day').fromNow()})\``, true)
      .addField('@ Mencionável', `\`${role.mentionable ? 'Sim' : 'Não'}\``, true)
      .addField(':military_medal: Posição', `\`${role.position}\``, true)
      .addField(':beginner: Hoist', `\`${role.hoist ? 'Sim' : 'Não'}\``, true)
      .addField(':busts_in_silhouette: Gerenciado', `\`${role.managed ? 'Sim' : 'Não'}\``, true)
      .addField(':8ball: Permissões', `\`\`\`\n${Object.keys(role.permissions.json).length ? Object.keys(role.permissions.json).join(', ') : 'Nenhuma'}\`\`\``)
      .setColor(role.color)
      .setTimestamp()
      .setFooter(`${message.author.username}#${message.author.discriminator}`, message.author.dynamicAvatarURL());

    message.channel.createMessage({ embed });
  }
}