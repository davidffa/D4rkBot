import Command from '../../structures/Command';
import Client from '../../structures/Client';
import CommandContext from '../../structures/CommandContext';

import { resolve } from 'path';

export default class Reload extends Command {
  constructor(client: Client) {
    super(client, {
      name: 'reload',
      description: 'Re-carrega um comando.',
      args: 1,
      usage: '<comando>',
      category: 'Dev',
    });
  }

  execute(ctx: CommandContext): void {
    if (ctx.author.id !== '334054158879686657') return;

    const cmdName = ctx.args[0].toLowerCase();

    const cmd = this.client.commands.find(c => c.name === cmdName || c.aliases?.includes(cmdName));

    if (!cmd) {
      ctx.sendMessage(`:x: Comando \`${cmdName}\` não encontrado.`);
      return;
    }

    const cmdPath = resolve(__dirname, '..', cmd.category ?? '', cmd.name);

    this.client.commands.splice(this.client.commands.indexOf(cmd), 1);
    delete require.cache[require.resolve(cmdPath)];

    try {
      const newCommand = new (require(cmdPath).default)(this.client);
      this.client.commands.push(newCommand);
    } catch (err: any) {
      ctx.sendMessage(`:x: Erro ao re-carregar o comando \`${cmd.name}\`: \n\`${err.message}\``);
    }

    ctx.sendMessage(`<a:verificado:803678585008816198> Comando \`${cmd.name}\` re-carregado com sucesso! `);
  }
}