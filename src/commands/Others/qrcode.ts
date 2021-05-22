import Command from '../../structures/Command';
import Client from '../../structures/Client';
import CommandContext from '../../structures/CommandContext';

import { Message } from 'eris';

import QRCode from 'qrcode';
import fetch from 'node-fetch';

export default class Qrcode extends Command {
  constructor(client: Client) {
    super(client, {
      name: 'qrcode',
      description: 'Cria ou lê um código QR.',
      args: 1,
      usage: '<Criar/Ler> <Texto>|<URL/Anexo>',
      category: 'Others',
      aliases: ['qr'],
      dm: true,
      cooldown: 4
    });
  }

  async execute(ctx: CommandContext): Promise<void> {
    if (ctx.channel.type === 0 && !ctx.channel.permissionsOf(this.client.user.id).has('embedLinks')) {
      ctx.sendMessage(':x: Preciso da permissão `Anexar Links` para executar este comando');
      return;
    }

    switch (ctx.args[0].toLowerCase()) {
      case 'criar':
      case 'create':
      case 'c':
        if (ctx.channel.type === 0 && !ctx.channel.permissionsOf(this.client.user.id).has('attachFiles')) {
          ctx.sendMessage(':x: Preciso da permissão `Anexar Arquivos` para executar este comando');
          return;
        }

        if (!ctx.args[1]) {
          ctx.sendMessage(`:x: **Usa:** ${this.client.guildCache.get(ctx.guild?.id as string)?.prefix || 'db.'}qrcode criar <Texto>`);
          return;
        }

        if (ctx.args.slice(1).join(' ').length > 800) {
          ctx.sendMessage(':x: Só podes criar códigos QR com textos até 800 caracteres.');
          return;
        }

        const url = await QRCode.toDataURL(ctx.args.slice(1).join(' '));
        const base64data = url.replace(/^data:image\/png;base64,/, '');

        const embed = new this.client.embed()
          .setTitle('<:qrcode:784833114761461800> QR Code')
          .setColor('RANDOM')
          .setImage('attachment://qr.png')
          .setTimestamp()
          .setFooter(`${ctx.author.username}#${ctx.author.discriminator}`, ctx.author.dynamicAvatarURL());

          ctx.sendMessage({ embed }, {
          name: 'qr.png',
          file: Buffer.from(base64data, 'base64')
        });

        break;

      case 'ler':
      case 'read':
      case 'r':
      case 'l':
        const qrURL = ctx.args[1] || (ctx.msg instanceof Message && ctx.msg.attachments[0]?.url);

        if (!qrURL) {
          ctx.sendMessage(`:x: **Usa:** ${this.client.guildCache.get(ctx.guild?.id as string)?.prefix || 'db.'}qrcode ler <URL/Anexo>`);
          return;
        }

        const data = await fetch(`http://api.qrserver.com/v1/read-qr-code/?fileurl=${qrURL}`)
          .then(res => res.json())
          .then(json => json[0].symbol[0].data)
          .catch(() => null);

        if (!data) {
          ctx.sendMessage(':x: Código QR inválido.');
          return;
        }

        const ebd = new this.client.embed()
          .setTitle('<:qrcode:784833114761461800> Leitor de QR Code')
          .setColor('RANDOM')
          .setDescription(`:newspaper: **Texto:**\n\n\`\`\`\n${data}\`\`\``)
          .setThumbnail(qrURL)
          .setTimestamp()
          .setFooter(`${ctx.author.username}#${ctx.author.discriminator}`, ctx.author.dynamicAvatarURL());

        ctx.sendMessage({ embed: ebd });
        break;
      default:
        ctx.sendMessage(`:x: **Usa:** \`${this.client.guildCache.get(ctx.guild?.id as string)?.prefix || 'db.'}qrcode <Criar/Ler> <Texto>|<URL/Anexo>\``)
        break;
    }
  }
}