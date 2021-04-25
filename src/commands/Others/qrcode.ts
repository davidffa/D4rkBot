import Command from '../../structures/Command';
import Client from '../../structures/Client';

import { Message } from 'eris';

import QRCode from 'qrcode';
import fetch from 'node-fetch';

export default class Qrcode extends Command {
  constructor(client: Client) {
    super(client, {
      name: 'qrcode',
      description: 'Cria ou lê um código QR',
      args: 1,
      usage: '<Criar/Ler> <Texto>|<URL/Anexo>',
      category: 'Others',
      aliases: ['qr'],
      dm: true,
      cooldown: 4
    });
  }

  async execute(message: Message, args: Array<string>): Promise<void> {
    if (message.channel.type === 0 && !message.channel.permissionsOf(this.client.user.id).has('embedLinks')) {
      message.channel.createMessage(':x: Preciso da permissão `Anexar Links` para executar este comando');
      return;
    }

    switch (args[0].toLowerCase()) {
      case 'criar':
      case 'create':
      case 'c':
        if (message.channel.type === 0 && !message.channel.permissionsOf(this.client.user.id).has('attachFiles')) {
          message.channel.createMessage(':x: Preciso da permissão `Anexar Arquivos` para executar este comando');
          return;
        }

        if (!args[1]) {
          message.channel.createMessage(`:x: **Usa:** ${this.client.guildCache.get(message.guildID as string)?.prefix || 'db.'}qrcode criar <Texto>`);
          return;
        }

        if (args.slice(1).join(' ').length > 800) {
          message.channel.createMessage(':x: Só podes criar códigos QR com textos até 800 caracteres.');
          return;
        }

        const url = await QRCode.toDataURL(args.slice(1).join(' '));
        const base64data = url.replace(/^data:image\/png;base64,/, '');

        const embed = new this.client.embed()
          .setTitle('<:qrcode:784833114761461800> QR Code')
          .setColor('RANDOM')
          .setImage('attachment://qr.png')
          .setTimestamp()
          .setFooter(`${message.author.username}#${message.author.discriminator}`, message.author.dynamicAvatarURL());

        message.channel.createMessage({ embed }, {
          name: 'qr.png',
          file: Buffer.from(base64data, 'base64')
        });

        break;

      case 'ler':
      case 'read':
      case 'r':
      case 'l':
        const qrURL = args[1] || message.attachments[0]?.url;

        if (!qrURL) {
          message.channel.createMessage(`:x: **Usa:** ${this.client.guildCache.get(message.guildID as string)?.prefix || 'db.'}qrcode ler <URL/Anexo>`);
          return;
        }

        const data = await fetch(`http://api.qrserver.com/v1/read-qr-code/?fileurl=${qrURL}`)
          .then(res => res.json())
          .then(json => json[0].symbol[0].data)
          .catch(() => null);

        if (!data) {
          message.channel.createMessage(':x: Código QR inválido.');
          return;
        }

        const ebd = new this.client.embed()
          .setTitle('<:qrcode:784833114761461800> Leitor de QR Code')
          .setColor('RANDOM')
          .setDescription(`:newspaper: **Texto:**\n\n\`\`\`\n${data}\`\`\``)
          .setThumbnail(qrURL)
          .setTimestamp()
          .setFooter(`${message.author.username}#${message.author.discriminator}`, message.author.dynamicAvatarURL());

        message.channel.createMessage({ embed: ebd });
        break;
      default:
        message.channel.createMessage(`:x: **Usa:** \`${this.client.guildCache.get(message.guildID as string)?.prefix || 'db.'}qrcode <Criar/Ler> <Texto>|<URL/Anexo>\``)
        break;
    }
  }
}