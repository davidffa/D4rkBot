import Command from '../../structures/Command';
import Client from '../../structures/Client';

import { Message, User } from 'eris';

export default class Blacklist extends Command {
  constructor(client: Client) {
    super(client, {
      name: 'blacklist',
      description: 'Adiciona/Retira alguém da blacklist do bot',
      args: 1,
      usage: '<list/add/remove> [user]',
      category: 'Dev',
      dm: true,
    });
  }

  async execute(message: Message, args: Array<string>): Promise<void> {
    if (message.author.id !== '334054158879686657') return;

    if (args[0].toLowerCase() === 'list') {
      if (!this.client.blacklist.length) {
        message.channel.createMessage(':x: A blacklist está vazia!');
        return;
      }

      const msg = this.client.blacklist.map(userID => {
        const user = this.client.users.get(userID);
        if (user) {
          return `${user.username}#${user.discriminator} (${user.id})`;
        }else {
          return userID;
        }
      })

      message.channel.createMessage(`:bookmark_tabs: Lista dos utilizadores na blacklist:\n\`\`\`\n${msg.join('\n')}\n\`\`\``);
    }else if (args[0].toLowerCase() === 'add' || args[0].toLowerCase() === 'remove') {
      let user: User;
      try {
        user = this.client.users.get(args[1]) || await this.client.getRESTUser(args[1]);
      }catch {
        message.channel.createMessage(':x: Utilizador não encontrado!')
        return;
      }

      if (user.id === '334054158879686657') {
        message.channel.createMessage(':x: Não podes adicionar o meu dono à blacklist!');
        return;
      }

      const botDB = await this.client.botDB.findOne({ botID: this.client.user.id });

      if (!botDB) {
        message.channel.createMessage(':x: BotDB não criada!');
        return;
      }
      
      if (args[0].toLowerCase() === 'add') {
        if (this.client.blacklist.includes(user.id)) {
          message.channel.createMessage(':x: Esse utilizador já está na blacklist!');
          return;
        }

        if (botDB.blacklist) {
          botDB.blacklist.push(user.id);
        }else {
          botDB.blacklist = []
        }

        await botDB.save();

        this.client.blacklist.push(user.id);

        message.channel.createMessage(`<a:verificado:803678585008816198> Utilizador \`${user.username}#${user.discriminator}\` adicionado à blacklist!`);
      }else {
        if (!this.client.blacklist.includes(user.id)) {
          message.channel.createMessage(':x: Esse utilizador não está na blacklist!');
          return;
        }

        if (botDB.blacklist) {
          botDB.blacklist.splice(botDB.blacklist.indexOf(user.id), 1);
        }else {
          botDB.blacklist = []
        }

        await botDB.save();

        this.client.blacklist.splice(this.client.blacklist.indexOf(user.id), 1);
        message.channel.createMessage(`<a:verificado:803678585008816198> Utilizador \`${user.username}#${user.discriminator}\` removido da blacklist!`);
      }
    }else {
      message.channel.createMessage(':x: Opção desconhecida! **Usa:** `list|add|remove`');
    }
  }
}