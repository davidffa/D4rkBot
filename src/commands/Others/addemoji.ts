import Command from '../../structures/Command';
import Client from '../../structures/Client';

import { Message } from 'eris';

import fetch from 'node-fetch';

export default class Addemoji extends Command {
  constructor(client: Client) {
    super(client, {
      name: 'addemoji',
      description: 'Adiciona um emoji no servidor',
      usage: '<URL/Anexo> <nome>',
      category: 'Others',
      cooldown: 4,
      args: 1
    });
  }

  async execute(message: Message, args: Array<string>): Promise<void> {
    if (message.channel.type !== 0 || !message.channel.guild.members.get(this.client.user.id)?.permissions.has('manageEmojis')) {
      message.channel.createMessage(':x: Preciso da permissão `Gerir Emojis` para executar este comando');
      return;
    }

    const urlRegex = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/g

    let imageURL: string;
    let emojiName: string;

    if (message.attachments.length) {
      imageURL = message.attachments[0].url;
      emojiName = args[0];
    } else {
      if (!urlRegex.test(args[0])) {
        message.channel.createMessage(':x: URL inválido!');
        return;
      }
      imageURL = args[0];
      if (!args[1]) {
        message.channel.createMessage(`:x: Argumentos em falta! **Use:** ${this.client.guildCache.get(message.guildID as string)?.prefix}addemoji <URL/Anexo> <nome>`);
        return;
      }
      emojiName = args[1];
    }

    if (emojiName.length < 2 || emojiName.length > 32) {
      message.channel.createMessage(':x: O nome do emoji tem de ter entre 2 e 32 caracteres.');
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
      message.channel.createMessage(':x: Imagem inválida!');
      return;
    }

    const base64 = `data:${type};base64,${buffer.toString('base64')}`;

    const imgWeight = ((base64.length * (3 / 4)) - (base64.endsWith('==') ? 1 : 2)) / 1024;

    if (imgWeight > 256) {
      message.channel.createMessage(':x: A imagem não pode ser maior do que 256 KB.');
      return;
    }

    try {
      const res = await message.channel.guild.createEmoji({
        image: base64,
        name: emojiName
      });

      message.channel.createMessage(`Emoji ${res.animated ? '<a:' : '<:'}${res.name}:${res.id}> adicionado.`);
    } catch (err) {
      if (err.message.includes('image: File cannot be larger than 256.0 kb')) {
        message.channel.createMessage(':x: A imagem não pode ser maior do que 256 KB.');
      } else {
        message.channel.createMessage(':x: Ocorreu um erro ao enviar o emoji.');
        console.error(err);
      }
    }
  }
}