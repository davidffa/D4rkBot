import Command from '../../structures/Command';
import Client from '../../structures/Client';
import CommandContext from '../../structures/CommandContext';

import { ReactionCollector } from '../../structures/Collector';

import { Message, User, Emoji } from 'eris';

import { Player } from 'erela.js';

import { inspect } from 'util';

import { GuildCache } from '../../typings';

import fetch from 'node-fetch';

export default class Eval extends Command {
  player: Player | null | undefined;
  guildCache: GuildCache | null | undefined;
  fetch: typeof fetch;

  constructor(client: Client) {
    super(client, {
      name: 'eval',
      description: 'Executa um código JavaScript e retorna o seu resultado',
      aliases: ['e', 'ev', 'evl', 'evaluate'],
      usage: '<código>',
      category: 'Dev',
      args: 1,
      dm: true
    });

    this.fetch = fetch;
  }

  async execute(ctx: CommandContext): Promise<void> {
    if (ctx.author.id !== '334054158879686657' || !ctx.guild) return;

    if (ctx.channel.type === 0) {
      this.player = this.client.music.get(ctx.guild.id);
      this.guildCache = this.client.guildCache.get(ctx.guild.id);
    } else {
      this.player = null
      this.guildCache = null;
    }

    const clean = (text: any): any => {
      if (typeof text === 'string') {
        text = text
          .replace(/`/g, `\`${String.fromCharCode(8203)}`)
          .replace(/@/g, `@${String.fromCharCode(8203)}`)
          .replace(new RegExp(process.env.TOKEN as string, 'gi'), '****');
      }
      return text;
    }

    try {
      const start = process.hrtime();
      const code = ctx.args.join(' ');
      let evaled = eval(code);

      if (evaled instanceof Promise)
        evaled = await evaled;

      const stop = process.hrtime(start);

      const time = ((stop[0] * 1e9) + stop[1]) / 1e6;

      const getType = (): string => {
        if (evaled === null) return 'null'
        else {
          return evaled?.constructor?.name ?? typeof evaled;
        }
      }

      const response = [
        `:outbox_tray: **Output** \`\`\`js\n${clean(inspect(evaled, { depth: 0 }))}\n\`\`\``,
        `<:lang_js:803678540528615424> **Tipo** \`\`\`js\n${getType()}\n\`\`\``,
        `:timer: **Tempo** \`\`\`${time > 1 ? `${time}ms` : `${(time * 1e3).toFixed(3)}μs`}\`\`\``
      ];

      const res = response.join('\n');

      if (res.length < 2e3) {
        await ctx.sendMessage(res);
      } else {
        const body = {
          files: [{
            name: 'Eval output result',
            content: `//Output:\n${clean(inspect(evaled, { depth: 0 }))}\n//Tipo:\n${getType()}\n//Tempo:\n${((stop[0] * 1e9) + stop[1]) / 1e6}ms`,
            languageId: 183
          }]
        }

        const bin = await fetch('https://sourceb.in/api/bins', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(body)
        }).then(res => res.json());

        if (bin.key) {
          await ctx.sendMessage(`:warning: O output passou dos 2000 caracteres. **Output:** https://sourceb.in/${bin.key}`);
        } else {
          await ctx.sendMessage(':warning: O output passou dos 2000 caracteres. Aqui vai o ficheiro com o output!', {
            name: 'eval.txt',
            file: Buffer.from(res)
          });
        }
      }

      if (ctx.channel.type === 0 && !ctx.channel.permissionsOf(this.client.user.id).has('addReactions')) return;

      ctx.sentMsg.addReaction('x_:751062867444498432');
      ctx.sentMsg.addReaction('📋');

      const filter = (r: Emoji, u: User) => (r.id === '751062867444498432' || r.name === '📋') && u === ctx.author;

      const collector = new ReactionCollector(this.client, ctx.sentMsg, filter, { max: 1, time: 3 * 60 * 1000 });

      collector.on('collect', async r => {
        switch (r.name) {
          case '📋':
            const dmChannel = await ctx.author.getDMChannel();
            dmChannel.createMessage(ctx.sentMsg.content);

            if (ctx.channel.type === 0 && ctx.channel.permissionsOf(this.client.user.id).has('manageMessages'))
              ctx.sentMsg.removeReactions();
            else {
              ctx.sentMsg.removeReaction('x_:751062867444498432');
              ctx.sentMsg.removeReaction('📋');
            }

            ctx.editMessage('<a:verificado:803678585008816198> Resultado da eval enviado no privado!');

            break;
          case 'x_':
            if (ctx.msg instanceof Message && ctx.msg.attachments.length === 1) {
              ctx.sentMsg.delete();
              return;
            }

            if (ctx.channel.type === 0 && ctx.channel.permissionsOf(this.client.user.id).has('manageMessages'))
              ctx.sentMsg.removeReactions();
            else {
              ctx.sentMsg.removeReaction('x_:751062867444498432');
              ctx.sentMsg.removeReaction('📋');
            }

            ctx.editMessage('<a:verificado:803678585008816198> Resultado da eval fechado!');
            break;
        }
      });

      collector.on('end', reason => {
        if (reason === 'Time')
          ctx.sentMsg.removeReaction('x_:751062867444498432');
        ctx.sentMsg.removeReaction('📋');
      });
    } catch (err) {
      ctx.sendMessage(`:x: Erro: \`\`\`x1\n${clean(err)}\`\`\``)
    }
  }
}