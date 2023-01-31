import Command from '../../structures/Command';
import Client from '../../structures/Client';
import CommandContext from '../../structures/CommandContext';

import { ComponentCollector } from '../../structures/Collector';

import { Message, ComponentInteraction, MessageActionRow } from 'oceanic.js';

import { Player } from 'vulkava';

import { inspect } from 'util';

import { GuildCache } from '../../typings';

export default class Eval extends Command {
  player: Player | null | undefined;
  guildCache: GuildCache | null | undefined;

  constructor(client: Client) {
    super(client, {
      name: 'eval',
      description: 'Executa um código JavaScript e retorna o seu resultado',
      aliases: ['e', 'ev', 'evl', 'evaluate'],
      usage: '<código>',
      category: 'Dev',
      args: 1,
    });
  }

  async execute(ctx: CommandContext): Promise<void> {
    if (ctx.author.id !== '334054158879686657' || !ctx.guild) return;

    if (ctx.channel.type === 0) {
      this.player = this.client.music.players.get(ctx.guild.id);
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
          .replace(new RegExp(process.env.TOKEN, 'gi'), '****');
      }
      return text;
    }

    let msg: Message;

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
    };

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
        msg = await ctx.sendMessage({ content: res, components: [components], fetchReply: true }) as Message;
      } else {
        const body = {
          files: [{
            name: 'Eval output result',
            content: `//Output:\n${clean(inspect(evaled, { depth: 0 }))}\n//Tipo:\n${getType()}\n//Tempo:\n${((stop[0] * 1e9) + stop[1]) / 1e6}ms`,
            languageId: 183
          }]
        }

        const bin = await this.client.request('https://sourceb.in/api/bins', {
          method: 'POST',
          body: JSON.stringify(body),
          headers: {
            'content-type': 'application/json',
          }
        }).then(res => res.body.json());

        if (bin.key) {
          msg = await ctx.sendMessage({ content: `:warning: O output passou dos 2000 caracteres. **Output:** https://sourceb.in/${bin.key}`, components: [components], fetchReply: true }) as Message;
        } else {
          msg = await ctx.sendMessage({
            content: ':warning: O output passou dos 2000 caracteres. Aqui vai o ficheiro com o output!',
            files: [
              {
                name: 'eval.txt',
                contents: Buffer.from(res)
              }
            ],
            components: [components],
            fetchReply: true
          }) as Message;
        }
      }
    } catch (err) {
      msg = await ctx.sendMessage({ content: `:x: Erro: \`\`\`x1\n${clean(err)}\`\`\``, components: [components], fetchReply: true }) as Message;
    }

    const filter = (i: ComponentInteraction) => i.member!.id === ctx.author.id;

    const collector = new ComponentCollector(this.client, msg, filter, { max: 1, time: 3 * 60 * 1000 });

    collector.on('collect', async i => {
      switch (i.data.customID) {
        case 'dm':
          const dmChannel = await ctx.author.createDM();
          dmChannel.createMessage({ content: msg.content });

          msg.edit({ content: '<a:verificado:803678585008816198> Resultado da eval enviado no privado!', components: [] });

          break;
        case 'delete':
          if (msg.attachments.size === 1) {
            msg.delete();
            return;
          }

          msg.edit({ content: '<a:verificado:803678585008816198> Resultado da eval fechado!', components: [] });
          break;
      }
    });

    collector.on('end', (r) => {
      if (r === 'Time')
        msg.edit({ components: [] });
    });
  }
}
