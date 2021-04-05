import Command from '../../structures/Command';
import Client from '../../structures/Client';

import { Message } from 'eris';

export default class Unban extends Command {
  constructor(client: Client) {
    super(client, {
      name: 'unban',
      description: 'Tira o ban a alguém',
      category: 'Moderation',
      cooldown: 4,
      args: 1,
      usage: '<user/ID>',
      aliases: ['removeban']
    });
  }

  async execute(message: Message, args: Array<string>): Promise<void> {
    if (message.channel.type !== 0 || !message.member) return;

    if (!message.member.permissions.has('banMembers')) {
      message.channel.createMessage(':x: Não tens permissão para desbanir membros.');
      return;
    }

    if (!message.channel.guild.members.get(this.client.user.id)?.permissions.has('banMembers')) {
      message.channel.createMessage(':x: Não tenho permissão para desbanir membros!');
      return;
    }

    const bans = await message.channel.guild.getBans();

    if (!bans.length) {
      message.channel.createMessage(':x: Este servidor não tem membros banidos!');
      return;
    }

    const member = bans.find(m => m.user.id === args[0] || m.user.username.toLowerCase().startsWith(args.join(' ').toLowerCase()));

    if (!member) {
      message.channel.createMessage(':x: Membro não encontrado!');
      return;
    }

    message.channel.guild.unbanMember(member.user.id).then(() => {
      message.channel.createMessage(`<a:verificado:803678585008816198> Desbanis-te o \`${member.user.username}#${member.user.discriminator}\``);
    }).catch(() => {
      message.channel.createMessage(':x: Ocorreu um erro ao tentar desbanir esse membro.');
    });
  }
}