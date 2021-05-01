import Command from '../../structures/Command';
import Client from '../../structures/Client';

import { Message } from 'eris';

import fetch from 'node-fetch';

export default class Restart extends Command {
  constructor(client: Client) {
    super(client, {
      name: 'restart',
      description: 'Reinicia uma aplicação na heroku',
      args: 1,
      usage: '<nome do app>',
      category: 'Dev',
      dm: true,
    });
  }

  async execute(message: Message, args: Array<string>): Promise<void> {
    if (message.author.id !== '334054158879686657') return;

    const { status, res } = await fetch(`https://api.heroku.com/apps/${args[0].toLowerCase()}/dynos`, {
      method: 'DELETE',
      headers: {
        'Accept': 'application/vnd.heroku+json; version=3',
        'Authorization': `Bearer ${process.env.HEROKUAPITOKEN}`
      }
    }).then(async (r) => {
      return {
        status: r.status,
        res: await r.json()
      }
    })

    if (res.id === 'not_found') {
      message.channel.createMessage(':x: Aplicação não encontrada!');
      return;
    }else if (res.id === 'forbidden') {
      message.channel.createMessage(':x: Não tens acesso a essa aplicação!');
      return;
    }

    if (status === 202) {
      message.channel.createMessage('<a:verificado:803678585008816198> Aplicação reiniciada com sucesso!');
    }else {
      message.channel.createMessage(':x: Não foi possível reiniciar essa aplicação!');
    }
    console.log(res);
  }
}