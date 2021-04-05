import Command from '../../structures/Command';
import Client from '../../structures/Client';

import { Message } from 'eris';

export default class Banlist extends Command {
  constructor(client: Client) {
    super(client, {
      name: 'banlist',
      description: 'Lista de bans',
      category: 'Moderation',
      cooldown: 10
    });
  }

  async execute(message: Message): Promise<void> {
    if (message.channel.type !== 0 || !message.member) return;

    if (!message.member.permissions.has('banMembers')) {
      message.channel.createMessage(':x: Não tens permissão para ver a lista de membros banidos.');
      return;
    }

    if (!message.channel.guild.members.get(this.client.user.id)?.permissions.has('banMembers')) {
      message.channel.createMessage(':x: Não tenho permissão para ver a lista de membros banidos!');
      return;
    }

    let msg = '';

    const bans = await message.channel.guild.getBans();

    if (!bans.length) {
      message.channel.createMessage(':x: Este servidor não tem membros banidos!');
      return;
    }

    bans.forEach(ban => {
      msg += `\`${ban.user.username}#${ban.user.discriminator}\`, `;
    });

    message.channel.createMessage(`:bookmark_tabs: Lista de membros banidos: \n${msg.slice(0, 1800)}${msg.length > 1800 ? '...' : ''}`);
  }
}