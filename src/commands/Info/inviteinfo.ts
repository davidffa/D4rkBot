import Command from '../../structures/Command';
import Client from '../../structures/Client';
import CommandContext from '../../structures/CommandContext';
import { dynamicAvatar } from '../../utils/dynamicAvatar';

export default class Inviteinfo extends Command {
  constructor(client: Client) {
    super(client, {
      name: 'inviteinfo',
      description: 'Mostra informações sobre um convite de um servidor.',
      category: 'Info',
      aliases: ['invinfo'],
      usage: '<ID do convite>',
      args: 1,
      cooldown: 4
    });
  }

  async execute(ctx: CommandContext): Promise<void> {
    try {
      const arr = ctx.args[0].split('/');
      const invite = await this.client.rest.channels.getInvite(arr[arr.length - 1], {
        withCounts: true,
        withExpiration: true
      });

      if (ctx.channel.type === 0 && !ctx.channel.permissionsOf(this.client.user.id).has('EMBED_LINKS')) {
        ctx.sendMessage({ content: ':x: Preciso da permissão `Anexar Links` para executar este comando.', flags: 1 << 6 });
        return;
      }

      const embed = new this.client.embed()
        .setTitle('Invite Info')
        .setColor('RANDOM')
        .addField(':id: ID', `\`${invite.code}\``, true)
        .addField(':desktop: Servidor', `\`${invite.guild?.name} (${invite.guild?.id})\``, true)
        .setURL(`https://discord.gg/${invite.code}`)
        .setFooter(`${ctx.author.username}#${ctx.author.discriminator}`, dynamicAvatar(ctx.author))
        .setTimestamp();

      invite.inviter && embed.addField(':man_shrugging: Quem convidou', `\`${invite.inviter?.username} (${invite.inviter?.id})\``, true)

      embed.addField('<:chat:804050576647913522> Canal', `\`${invite.channel?.name ?? 'Desconhecido'}\``, true)
        .addField('<:followers:784795303156908032> Total de membros (aproximado)', `\`${invite.approximateMemberCount}\``, true)

      invite.guild?.iconURL && embed.setThumbnail(invite.guild.iconURL()!)
      ctx.sendMessage({ embeds: [embed] });
    } catch (_) {
      ctx.sendMessage({ content: ':x: Convite inválido!', flags: 1 << 6 });
    }
  }
}