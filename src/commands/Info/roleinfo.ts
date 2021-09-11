import Command from '../../structures/Command';
import Client from '../../structures/Client';
import CommandContext from '../../structures/CommandContext';

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
      ctx.sendMessage({ content: ':x: Preciso da permissão `Anexar Links` para executar este comando', flags: 1 << 6 });
      return;
    }

    const query = ctx.args.join(' ');

    const role = ctx.guild.roles.get(query)
      || ctx.guild.roles.find(r => r.name === query)
      || ctx.guild.roles.find(r => r.name.includes(query))
      || ctx.guild.roles.find(r => r.name.toLowerCase().includes(query.toLowerCase()));

    if (!role) {
      ctx.sendMessage({ content: ':x: Cargo não encontrado!', flags: 1 << 6 });
      return;
    }

    const embed = new this.client.embed()
      .setTitle(`Informações do cargo ${role.name}`)
      .addField(':id: ID', `\`${role.id}\``, true)
      .addField(':calendar: Criado em', `<t:${Math.floor(role.createdAt / 1e3)}:d> (<t:${Math.floor(role.createdAt / 1e3)}:R>)`, true)
      .addField('@ Mencionável', `\`${role.mentionable ? 'Sim' : 'Não'}\``, true)
      .addField(':military_medal: Posição', `\`${role.position}\``, true)
      .addField(':beginner: Separado', `\`${role.hoist ? 'Sim' : 'Não'}\``, true)
      .addField(':robot: Gerenciado', `\`${role.managed ? 'Sim' : 'Não'}\``, true)
      .addField(':busts_in_silhouette: Membros', `\`${ctx.guild.members.filter(m => m.roles.includes(role.id)).length}\``, true)
      .addField(':8ball: Permissões', `\`\`\`\n${Object.keys(role.permissions.json).length ? Object.keys(role.permissions.json).join(', ') : 'Nenhuma'}\`\`\``)
      .setColor(role.color)
      .setTimestamp()
      .setFooter(`${ctx.author.username}#${ctx.author.discriminator}`, ctx.author.dynamicAvatarURL());

    ctx.sendMessage({ embeds: [embed] });
  }
}