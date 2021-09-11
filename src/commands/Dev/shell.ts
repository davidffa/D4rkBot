import Command from '../../structures/Command';
import Client from '../../structures/Client';
import CommandContext from '../../structures/CommandContext';
import { ReactionCollector } from '../../structures/Collector';

import { Message, Emoji, User } from 'eris';

import fetch from 'node-fetch';
import { exec } from 'child_process';

export default class Shell extends Command {
  constructor(client: Client) {
    super(client, {
      name: 'shell',
      description: 'Executa um comando no terminal e retorna o seu resultado',
      aliases: ['sh'],
      args: 1,
      dm: true,
      usage: '<comando>',
      category: 'Dev',
    });
  }

  execute(ctx: CommandContext) {
    if (ctx.author.id !== '334054158879686657') return;

    exec(ctx.args.join(' '), async (_err, stdout, stderr) => {
      if (!stdout && !stderr) {
        ctx.sendMessage(':warning: Sem output!');
        return;
      }

      const res = stdout || stderr;

      let msg: Message;

      if (res.length + 15 < 2e3) {
        if (stderr) {
          msg = await ctx.sendMessage(`:x: Erro: \`\`\`sh\n${res}\`\`\``, true) as Message;
        } else {
          msg = await ctx.sendMessage(`:outbox_tray: **Output:**\`\`\`sh\n${res}\n\`\`\``, true) as Message;
        }
      } else {
        const body = {
          files: [{
            name: 'Shell output result',
            content: res,
            languageId: 346
          }]
        };

        const bin = await fetch('https://sourceb.in/api/bins', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(body)
        }).then(res => res.json());

        if (bin.key) {
          msg = await ctx.sendMessage(`:warning: O output passou dos 2000 caracteres. **Output:** https://sourceb.in/${bin.key}`, true) as Message;
        } else {
          msg = await ctx.sendMessage({
            content: ':warning: O output passou dos 2000 caracteres. Aqui vai o ficheiro com o output!',
            file: [
              {
                name: 'shell.txt',
                file: Buffer.from(res)
              }
            ]
          }, true) as Message;
        }
      }
      if (ctx.channel.type === 0 && !ctx.channel.permissionsOf(this.client.user.id).has('addReactions')) return;

      msg.addReaction('x_:751062867444498432');
      msg.addReaction('📋');

      const filter = (r: Emoji, user: User) => (r.id === '751062867444498432' || r.name === '📋') && user === ctx.author;

      const collector = new ReactionCollector(this.client, msg, filter, { time: 3 * 60 * 1000, max: 1 });

      collector.on('collect', async r => {
        switch (r.name) {
          case '📋':
            const dmChannel = await ctx.author.getDMChannel();
            dmChannel.createMessage(msg.content);

            if (ctx.channel.type === 0 && ctx.channel.permissionsOf(this.client.user.id).has('manageMessages'))
              msg.removeReactions();
            else {
              msg.removeReaction('x_:751062867444498432');
              msg.removeReaction('📋');
            }

            msg.edit('<a:verificado:803678585008816198> Resultado do shell enviado no privado!');

            break;
          case 'x_':
            if (msg.attachments.length === 1) {
              msg.delete();
              return;
            }

            if (ctx.channel.type === 0 && ctx.channel.permissionsOf(this.client.user.id).has('manageMessages'))
              msg.removeReactions();
            else {
              msg.removeReaction('x_:751062867444498432');
              msg.removeReaction('📋');
            }

            msg.edit('<a:verificado:803678585008816198> Resultado da shell fechado!');
            break;
        }
      });

      collector.on('end', reason => {
        if (reason === 'Time')
          msg.removeReaction('x_:751062867444498432');
        msg.removeReaction('📋');
      });
    })
  }
}