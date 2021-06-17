import Command from '../../structures/Command';
import Client from '../../structures/Client';
import CommandContext from '../../structures/CommandContext';

import moment from 'moment';
moment.locale('pt');

export default class RoleInfo extends Command {
  constructor(client: Client) {
    super(client, {
      name: 'roleinfo',
      description: 'Informação sobre um cargo no servidor.',
      usage: '<Cargo>',
      args: 1,
      cooldown: 4,
      category: 'Info'
    });
  }

  execute(ctx: CommandContext): void {
    if (ctx.channel.type !== 0 || !ctx.guild) return;

    if (!ctx.channel.permissionsOf(this.client.user.id).has('embedLinks')) {
      ctx.sendMessage(':x: Preciso da permissão `Anexar Links` para executar este comando');
      return;
    }

    const query = args.join(' ');

    const role = ctx.guild.roles.get(query)
      || ctx.guild.roles.find(r => r.name === query)
      || ctx.guild.roles.find(r => r.name.includes(query))
      || ctx.guild.roles.find(r => r.name.toLowerCase().includes(query.toLowerCase()));

    if (!role) {
      ctx.sendMessage(':x: Cargo não encontrado!');
      return;
    }

    const embed = new this.client.embed()
      .setTitle(`Informações do cargo ${role.name}`)
      .addField(':id: ID', `\`${role.id}\``, true)
      .addField(':calendar: Criado em', `\`${moment(role.createdAt).format('L')} (${moment(role.createdAt).startOf('day').fromNow()})\``, true)
      .addField('@ Mencionável', `\`${role.mentionable ? 'Sim' : 'Não'}\``, true)
      .addField(':military_medal: Posição', `\`${role.position}\``, true)
      .addField(':beginner: Separado', `\`${role.hoist ? 'Sim' : 'Não'}\``, true)
      .addField(':busts_in_silhouette: Gerenciado', `\`${role.managed ? 'Sim' : 'Não'}\``, true)
      .addField(':8ball: Permissões', `\`\`\`\n${Object.keys(role.permissions.json).length ? Object.keys(role.permissions.json).join(', ') : 'Nenhuma'}\`\`\``)
      .setColor(role.color)
      .setTimestamp()
      .setFooter(`${ctx.author.username}#${ctx.author.discriminator}`, ctx.author.dynamicAvatarURL());

    ctx.sendMessage({ embed });
  }
}