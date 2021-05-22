import Command from '../../structures/Command';
import Client from '../../structures/Client';
import CommandContext from '../../structures/CommandContext';

import { Message } from 'eris';

import fetch from 'node-fetch';

export default class Addemoji extends Command {
  constructor(client: Client) {
    super(client, {
      name: 'addemoji',
      description: 'Adiciona um emoji no servidor.',
      usage: '<URL/Anexo> <nome>',
      category: 'Others',
      cooldown: 4,
      args: 1
    });
  }

  async execute(ctx: CommandContext): Promise<void> {
    if (!ctx.guild) return;
    if (ctx.channel.type !== 0 || !ctx.channel.guild.members.get(this.client.user.id)?.permissions.has('manageEmojis')) {
      ctx.sendMessage(':x: Preciso da permissão `Gerir Emojis` para executar este comando!');
      return;
    }

    if (!ctx.msg.member?.permissions.has('manageEmojis')) {
      ctx.sendMessage(':x: Precisas da permissão `Gerir Emojis` para executar este comando!')
      return;
    } 

    const urlRegex = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/g

    let imageURL: string;
    let emojiName: string;

    if (ctx.msg instanceof Message && ctx.msg.attachments.length) {
      imageURL = ctx.msg.attachments[0].url;
      emojiName = ctx.args[0];
    } else {
      if (!urlRegex.test(ctx.args[0])) {
        ctx.sendMessage(':x: URL inválido!');
        return;
      }
      imageURL = ctx.args[0];
      if (!ctx.args[1]) {
        ctx.sendMessage(`:x: Argumentos em falta! **Usa:** \`${this.client.guildCache.get(ctx.guild.id)?.prefix}addemoji <URL/Anexo> <nome>\``);
        return;
      }
      emojiName = ctx.args[1];
    }

    if (emojiName.length < 2 || emojiName.length > 32) {
      ctx.sendMessage(':x: O nome do emoji tem de ter entre 2 e 32 caracteres.');
      return;
    }

    const { buffer, type } = await fetch(imageURL).then(async (res) => {
      const buff = await res.buffer();
      const types = res.headers.get('content-type');

      if (!types || !(/image\/png|image\/jpeg|image\/jpg|image\/gif/g.test(types))) {
        return { buffer: buff, type: null };
      }
      return { buffer: buff, type: types };
    });

    if (!type) {
      ctx.sendMessage(':x: Imagem inválida!');
      return;
    }

    const base64 = `data:${type};base64,${buffer.toString('base64')}`;

    const imgWeight = ((base64.length * (3 / 4)) - (base64.endsWith('==') ? 1 : 2)) / 1024;

    if (imgWeight > 256) {
      ctx.sendMessage(':x: A imagem não pode ser maior do que 256 KB.');
      return;
    }

    try {
      const res = await ctx.guild.createEmoji({
        image: base64,
        name: emojiName
      });

      ctx.sendMessage(`Emoji ${res.animated ? '<a:' : '<:'}${res.name}:${res.id}> adicionado.`);
    } catch (err) {
      if (err.message.includes('image: File cannot be larger than 256.0 kb')) {
        ctx.sendMessage(':x: A imagem não pode ser maior do que 256 KB.');
      } else {
        ctx.sendMessage(':x: Ocorreu um erro ao enviar o emoji.');
        console.error(err);
      }
    }
  }
}