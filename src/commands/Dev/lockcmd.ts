import Command from '../../structures/Command';
import Client from '../../structures/Client';

import { Message } from 'eris';

export default class LockCmd extends Command {
  constructor(client: Client) {
    super(client, {
      name: 'lockcmd',
      description: 'Colocar/Tirar um comando em manutenção',
      args: 1,
      usage: '<comando>',
      category: 'Dev',
      dm: true,
    });
  }

  async execute(message: Message, args: Array<string>) {
    if (message.author.id !== '334054158879686657') return;

    const command = this.client.commands.find(c => c.name === args[0] || c.aliases?.includes(args[0]));

    if (!command) {
      message.channel.createMessage(`:x: Comando \`${args[0]}\` não encontrado.`);
      return;
    }

    if (this.client.lockedCmds.includes(command.name)) {
      this.client.lockedCmds.splice(this.client.lockedCmds.indexOf(command.name), 1);
      message.channel.createMessage(`<a:verificado:803678585008816198> Comando \`${args[0]}\` retirado de manutenção.`);
    } else {
      this.client.lockedCmds.push(command.name);
      message.channel.createMessage(`<a:verificado:803678585008816198> Comando \`${args[0]}\` colocado em manutenção.`);
    }

    const res = await this.client.botDB.findOne({ botID: this.client.user.id });
    if (res) {
      res.lockedCmds = this.client.lockedCmds;
      res.save();
    }
  }
}