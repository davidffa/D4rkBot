import Command from '../../structures/Command';
import Client from '../../structures/Client';
import CommandContext from '../../structures/CommandContext';
import { ComponentCollector } from '../../structures/Collector';

import { Message, ActionRow, ActionRowComponents, ComponentInteraction } from 'eris';

import { exec } from 'child_process';

export default class Shell extends Command {
  constructor(client: Client) {
    super(client, {
      name: 'shell',
      description: 'Executa um comando no terminal e retorna o seu resultado',
      aliases: ['sh'],
      args: 1,
      usage: '<comando>',
      category: 'Dev',
    });
  }

  execute(ctx: CommandContext) {
    if (ctx.author.id !== '334054158879686657') return;

    const components: ActionRowComponents[] = [
      {
        custom_id: 'delete',
        style: 4,
        type: 2,
        emoji: {
          name: '🗑️'
        }
      },
      {
        custom_id: 'dm',
        style: 2,
        type: 2,
        emoji: {
          name: '📋'
        }
      }
    ]

    const row: ActionRow = {
      type: 1,
      components
    }

    exec(ctx.args.join(' '), async (_err, stdout, stderr) => {
      if (!stdout && !stderr) {
        ctx.sendMessage(':warning: Sem output!');
        return;
      }

      const res = stdout || stderr;

      let msg: Message;

      if (res.length + 15 < 2e3) {
        if (stderr) {
          msg = await ctx.sendMessage({ content: `:x: Erro: \`\`\`sh\n${res}\`\`\``, components: [row] }, true) as Message;
        } else {
          msg = await ctx.sendMessage({ content: `:outbox_tray: **Output:**\`\`\`sh\n${res}\n\`\`\``, components: [row] }, true) as Message;
        }
      } else {
        const body = {
          files: [{
            name: 'Shell output result',
            content: res,
            languageId: 346
          }]
        };

        const bin = await this.client.request('https://sourceb.in/api/bins', {
          method: 'POST',
          body
        }).then(res => res.json());

        if (bin.key) {
          msg = await ctx.sendMessage({ content: `:warning: O output passou dos 2000 caracteres. **Output:** https://sourceb.in/${bin.key}`, components: [row] }, true) as Message;
        } else {
          msg = await ctx.sendMessage({
            content: ':warning: O output passou dos 2000 caracteres. Aqui vai o ficheiro com o output!',
            attachments: [
              {
                name: 'shell.txt',
                file: Buffer.from(res)
              }
            ],
            components: [row]
          }, true) as Message;
        }
      }

      const filter = (i: ComponentInteraction) => i.member!.id === ctx.author.id;

      const collector = new ComponentCollector(this.client, msg, filter, { max: 1, time: 3 * 60 * 1000 });

      collector.on('collect', async i => {
        switch (i.data.custom_id) {
          case 'dm':
            const dmChannel = await ctx.author.getDMChannel();
            dmChannel.createMessage(msg.content);

            msg.edit({ content: '<a:verificado:803678585008816198> Resultado do shell enviado no privado!', components: [] });

            break;
          case 'delete':
            if (msg.attachments.length === 1) {
              msg.delete();
              return;
            }

            msg.edit({ content: '<a:verificado:803678585008816198> Resultado da shell fechado!', components: [] });
            break;
        }
      })

      collector.on('end', (r) => {
        if (r === 'Time')
          msg.edit({ components: [] });
      });
    })
  }
}