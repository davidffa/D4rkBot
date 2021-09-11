import Command from '../../structures/Command';
import Client from '../../structures/Client';
import CommandContext, { Type } from '../../structures/CommandContext';
import { ReactionCollector } from '../../structures/Collector';

import { inflateSync } from 'zlib';

import { Emoji, User, Message } from 'eris';

import fetch from 'node-fetch';

export default class Render extends Command {
  constructor(client: Client) {
    super(client, {
      name: 'render',
      description: 'Renderiza uma página web.',
      args: 1,
      usage: '<URL>',
      category: 'Others',
      aliases: ['webrender', 'renderizar'],
      cooldown: 10
    });
  }

  async execute(ctx: CommandContext): Promise<void> {
    if (ctx.channel.type !== 0) return;

    if (!ctx.channel.nsfw && ctx.author.id !== '334054158879686657') {
      ctx.sendMessage({ content: ':x: Só podes usar este comando em um canal NSFW.', flags: 1 << 6 });
      return;
    }

    if (!ctx.channel.permissionsOf(this.client.user.id).has('attachFiles')) {
      ctx.sendMessage({ content: ':x: Preciso da permissão `Anexar Arquivos` para executar este comando', flags: 1 << 6 });
      return;
    }

    if (!ctx.channel.permissionsOf(this.client.user.id).has('embedLinks')) {
      ctx.sendMessage({ content: ':x: Preciso da permissão `Anexar Links` para executar este comando', flags: 1 << 6 });
      return;
    }

    let waitMsg: Message | undefined;

    if (ctx.type === Type.INTERACTION) {
      ctx.defer();
    } else {
      waitMsg = await ctx.sendMessage('<a:loading2:805088089319407667> A verificar se o URL é válido...', true) as Message;
    }

    let url = ctx.args[0];

    if (!ctx.args[0].startsWith('http'))
      url = 'http://' + ctx.args[0];

    const exists = async (): Promise<string | null> => {
      return new Promise(async (resolve) => {
        setTimeout(() => {
          resolve(null);
        }, 5e3);

        try {
          const res = await fetch(url);

          if (res)
            resolve(res.url);
          else
            resolve(null)
        } catch (err) {
          resolve(null);
        }
      })
    }

    const finalURL = await exists();

    if (!finalURL) {
      if (ctx.type === Type.INTERACTION) {
        ctx.sendMessage(`:x: ${ctx.member?.mention}, esse site não existe ou não respondeu dentro de 5 segundos.`);
      } else {
        waitMsg?.edit(`:x: ${ctx.member?.mention}, esse site não existe ou não respondeu dentro de 5 segundos.`);
      }
      return;
    }

    if (ctx.type === Type.MESSAGE) waitMsg?.edit('<a:loading2:805088089319407667> A renderizar a página...');

    const embed = new this.client.embed()
      .setColor('RANDOM')
      .setTitle('Render')
      .setURL(finalURL)
      .setImage('attachment://render.png')
      .setTimestamp()
      .setFooter(`${ctx.author.username}#${ctx.author.discriminator}`, ctx.author.dynamicAvatarURL());

    const res = await fetch(`${process.env.RENDERAPIURL}?url=${encodeURIComponent(finalURL)}`, {
      headers: {
        Authorization: process.env.RENDERAPITOKEN as string,
      },
    }).then(r => {
      if (r.status !== 200) return null;
      return r.buffer();
    });

    if (!res) {
      if (ctx.type === Type.INTERACTION) {
        ctx.sendMessage(':x: Site inválido');
      } else {
        waitMsg?.edit(':x: Site inválido');
      }
      return;
    }

    const inflate = inflateSync(res);

    if (!inflate) {
      if (ctx.type === Type.INTERACTION) {
        ctx.sendMessage(':x: Site inválido');
      } else {
        waitMsg?.edit(':x: Site inválido');
      }
      return;
    }

    waitMsg?.delete();
    const msg = await ctx.sendMessage({
      embeds: [embed],
      file: [
        {
          name: 'render.png',
          file: inflate
        }
      ]
    }, true) as Message;

    await msg.addReaction('x_:751062867444498432');

    const filter = (r: Emoji, user: User) => (r.id === '751062867444498432') && user === ctx.author;
    const collector = new ReactionCollector(this.client, msg, filter, { max: 1, time: 5 * 60 * 1000 });

    collector.on('collect', () => {
      msg.delete();
    });

    collector.on('end', reason => {
      if (reason === 'Time')
        msg.removeReaction('x_:751062867444498432');
    });
  }
}