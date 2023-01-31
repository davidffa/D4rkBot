import Command from '../../structures/Command';
import Client from '../../structures/Client';
import CommandContext from '../../structures/CommandContext';
import { ComponentCollector } from '../../structures/Collector';

import { Message, ComponentInteraction, MessageActionRow } from 'oceanic.js';

import { exec } from 'child_process';

const ANSI_REGEX = /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g;
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

    const components: MessageActionRow = {
      type: 1,
      components: [
        {
          customID: 'delete',
          style: 4,
          type: 2,
          emoji: {
            id: null,
            name: '🗑️'
          }
        },
        {
          customID: 'dm',
          style: 2,
          type: 2,
          emoji: {
            id: null,
            name: '📋'
          }
        }
      ]
    }

    exec(ctx.args.join(' '), async (_err, stdout, stderr) => {
      if (!stdout && !stderr) {
        ctx.sendMessage(':warning: Sem output!');
        return;
      }

      const res = (stdout || stderr).replace(ANSI_REGEX, '');

      let msg: Message;

      if (res.length + 15 < 2e3) {
        if (stderr) {
          msg = await ctx.sendMessage({ content: `:outbox_tray: Stderr: \`\`\`sh\n${res}\n\`\`\``, components: [components], fetchReply: true }) as Message;
        } else {
          msg = await ctx.sendMessage({ content: `:outbox_tray: **Stdout:**\`\`\`sh\n${res}\n\`\`\``, components: [components], fetchReply: true }) as Message;
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
          body: JSON.stringify(body),
          headers: {
            'content-type': 'application/json',
          }
        }).then(res => res.json());

        if (bin.key) {
          msg = await ctx.sendMessage({ content: `:warning: O output passou dos 2000 caracteres. **Output:** https://sourceb.in/${bin.key}`, components: [components], fetchReply: true }) as Message;
        } else {
          msg = await ctx.sendMessage({
            content: ':warning: O output passou dos 2000 caracteres. Aqui vai o ficheiro com o output!',
            files: [
              {
                name: 'shell.txt',
                contents: Buffer.from(res)
              }
            ],
            components: [components],
            fetchReply: true
          }) as Message;
        }
      }

      const filter = (i: ComponentInteraction) => i.member!.id === ctx.author.id;

      const collector = new ComponentCollector(this.client, msg, filter, { max: 1, time: 3 * 60 * 1000 });

      collector.on('collect', async i => {
        switch (i.data.customID) {
          case 'dm':
            const dmChannel = await ctx.author.createDM();
            dmChannel.createMessage({ content: msg.content });

            msg.edit({ content: '<a:verificado:803678585008816198> Resultado do shell enviado no privado!', components: [] });

            break;
          case 'delete':
            if (msg.attachments.size === 1) {
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