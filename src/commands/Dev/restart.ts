import Command from '../../structures/Command';
import Client from '../../structures/Client';
import CommandContext from '../../structures/CommandContext';

export default class Restart extends Command {
  constructor(client: Client) {
    super(client, {
      name: 'restart',
      description: 'Reinicia uma aplicação na heroku',
      args: 1,
      usage: '<nome do app>',
      category: 'Dev',
    });
  }

  async execute(ctx: CommandContext): Promise<void> {
    if (ctx.author.id !== '334054158879686657') return;

    const { status, res } = await this.client.request(`https://api.heroku.com/apps/${ctx.args[0].toLowerCase()}/dynos`, {
      method: 'DELETE',
      headers: {
        'Accept': 'application/vnd.heroku+json; version=3',
        'Authorization': `Bearer ${process.env.HEROKUAPITOKEN}`
      }
    }).then(r => {
      return {
        status: r.status,
        res: r.json
      }
    });

    if (res.id === 'not_found') {
      ctx.sendMessage(':x: Aplicação não encontrada!');
      return;
    } else if (res.id === 'forbidden') {
      ctx.sendMessage(':x: Não tens acesso a essa aplicação!');
      return;
    }

    if (status === 202) {
      ctx.sendMessage('<a:verificado:803678585008816198> Aplicação reiniciada com sucesso!');
    } else {
      ctx.sendMessage(':x: Não foi possível reiniciar essa aplicação!');
    }
  }
}