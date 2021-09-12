import Command from '../../structures/Command';
import Client from '../../structures/Client';
import CommandContext from '../../structures/CommandContext';

import { User } from 'eris';

export default class Blacklist extends Command {
  constructor(client: Client) {
    super(client, {
      name: 'blacklist',
      description: 'Adiciona/Retira alguém da blacklist do bot',
      args: 1,
      usage: '<list/add/remove> [user]',
      category: 'Dev',
    });
  }

  async execute(ctx: CommandContext): Promise<void> {
    if (ctx.author.id !== '334054158879686657') return;

    if (ctx.args[0].toLowerCase() === 'list') {
      if (!this.client.blacklist.length) {
        ctx.sendMessage(':x: A blacklist está vazia!');
        return;
      }

      const msg = this.client.blacklist.map(userID => {
        const user = this.client.users.get(userID);
        if (user) {
          return `${user.username}#${user.discriminator} (${user.id})`;
        } else {
          return userID;
        }
      })

      ctx.sendMessage(`:bookmark_tabs: Lista dos utilizadores na blacklist:\n\`\`\`\n${msg.join('\n')}\n\`\`\``);
    } else if (ctx.args[0].toLowerCase() === 'add' || ctx.args[0].toLowerCase() === 'remove') {
      let user: User;
      try {
        user = this.client.users.get(ctx.args[1]) || await this.client.getRESTUser(ctx.args[1]);
      } catch {
        ctx.sendMessage(':x: Utilizador não encontrado!')
        return;
      }

      if (user.id === '334054158879686657') {
        ctx.sendMessage(':x: Não podes adicionar o meu dono à blacklist!');
        return;
      }

      const botDB = await this.client.botDB.findOne({ botID: this.client.user.id });

      if (!botDB) {
        ctx.sendMessage(':x: BotDB não criada!');
        return;
      }

      if (ctx.args[0].toLowerCase() === 'add') {
        if (this.client.blacklist.includes(user.id)) {
          ctx.sendMessage(':x: Esse utilizador já está na blacklist!');
          return;
        }

        if (botDB.blacklist) {
          botDB.blacklist.push(user.id);
        } else {
          botDB.blacklist = []
        }

        await botDB.save();

        this.client.blacklist.push(user.id);

        ctx.sendMessage(`<a:verificado:803678585008816198> Utilizador \`${user.username}#${user.discriminator}\` adicionado à blacklist!`);
      } else {
        if (!this.client.blacklist.includes(user.id)) {
          ctx.sendMessage(':x: Esse utilizador não está na blacklist!');
          return;
        }

        if (botDB.blacklist) {
          botDB.blacklist.splice(botDB.blacklist.indexOf(user.id), 1);
        } else {
          botDB.blacklist = []
        }

        await botDB.save();

        this.client.blacklist.splice(this.client.blacklist.indexOf(user.id), 1);
        ctx.sendMessage(`<a:verificado:803678585008816198> Utilizador \`${user.username}#${user.discriminator}\` removido da blacklist!`);
      }
    } else {
      ctx.sendMessage(':x: Opção desconhecida! **Usa:** `list|add|remove`');
    }
  }
}