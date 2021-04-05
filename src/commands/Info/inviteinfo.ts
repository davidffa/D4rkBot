import Command from '../../structures/Command';
import Client from '../../structures/Client';

import { Message } from 'eris';

export default class Inviteinfo extends Command {
  constructor(client: Client) {
    super(client, {
      name: 'inviteinfo',
      description: 'Mostra informações sobre um convite de um servidor',
      category: 'Info',
      aliases: ['invinfo'],
      dm: true,
      usage: '<ID do convite>',
      args: 1,
      cooldown: 4
    });
  }

  async execute(message: Message, args: Array<string>): Promise<void> {
    try {
      const invite = await this.client.getInvite(args[0], true);

      if (message.channel.type === 0 && !message.channel.permissionsOf(this.client.user.id).has('embedLinks')) {
        message.channel.createMessage(':x: Preciso da permissão `Anexar Links` para executar este comando.');
        return;
      }

      const embed = new this.client.embed()
        .setTitle('Invite Info')
        .setColor('RANDOM')
        .addField(':id: ID', `\`${invite.code}\``, true)
        .addField(':desktop: Servidor', `\`${invite.guild?.name} (${invite.guild?.id})\``, true)
        .setURL(`https://discord.gg/${invite.code}`)
        .setFooter(`${message.author.username}#${message.author.discriminator}`, message.author.dynamicAvatarURL())
        .setTimestamp();

      invite.inviter && embed.addField(':man_shrugging: Quem convidou', `\`${invite.inviter?.username} (${invite.inviter?.id})\``, true)

      embed.addField('<:chat:804050576647913522> Canal', `\`${invite.channel.name}\``, true)
        .addField('<:followers:784795303156908032> Total de membros (aproximado)', `\`${invite.memberCount}\``, true)

      invite.guild?.iconURL && embed.setThumbnail(invite.guild.dynamicIconURL())
      message.channel.createMessage({ embed });
    } catch (_) {
      message.channel.createMessage(':x: Convite inválido!');
    }
  }
}