import Command from '../../structures/Command';
import Client from '../../structures/Client';
import CommandContext from '../../structures/CommandContext';
import { dynamicAvatar } from '../../utils/dynamicAvatar';

export default class Qrcode extends Command {
  constructor(client: Client) {
    super(client, {
      name: 'qrcode',
      description: 'Cria ou lê um código QR.',
      args: 1,
      usage: '<Criar/Ler> <Texto>|<URL/Anexo>',
      category: 'Others',
      aliases: ['qr'],
      cooldown: 4
    });
  }

  async execute(ctx: CommandContext): Promise<void> {
    if (ctx.channel.type === 0 && !ctx.channel.permissionsOf(this.client.user.id).has('EMBED_LINKS')) {
      ctx.sendMessage({ content: ':x: Preciso da permissão `Anexar Links` para executar este comando', flags: 1 << 6 });
      return;
    }

    switch (ctx.args[0].toLowerCase()) {
      case 'criar':
      case 'create':
      case 'c':
        if (ctx.channel.type === 0 && !ctx.channel.permissionsOf(this.client.user.id).has('ATTACH_FILES')) {
          ctx.sendMessage({ content: ':x: Preciso da permissão `Anexar Arquivos` para executar este comando', flags: 1 << 6 });
          return;
        }

        if (!ctx.args[1]) {
          ctx.sendMessage({ content: `:x: **Usa:** /qrcode criar <Texto>`, flags: 1 << 6 });
          return;
        }

        if (ctx.args.slice(1).join(' ').length > 800) {
          ctx.sendMessage({ content: ':x: Só podes criar códigos QR com textos até 800 caracteres.', flags: 1 << 6 });
          return;
        }

        await ctx.defer();

        const buffer = await fetch(`https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(ctx.args.slice(1).join(' '))}`).then(async r => Buffer.from(await r.arrayBuffer()));

        const embed = new this.client.embed()
          .setTitle('<:qrcode:784833114761461800> QR Code')
          .setColor('RANDOM')
          .setImage('attachment://qr.png')
          .setTimestamp()
          .setFooter(`${ctx.author.username}#${ctx.author.discriminator}`, dynamicAvatar(ctx.author));

        ctx.sendMessage({
          embeds: [embed],
          files: [
            {
              name: 'qr.png',
              contents: buffer
            }
          ]
        });

        break;

      case 'ler':
      case 'read':
      case 'r':
      case 'l':
        const qrURL = ctx.args[1] || ctx.attachments[0]?.url;

        if (!qrURL) {
          ctx.sendMessage({ content: `:x: **Usa:** /qrcode ler <URL/Anexo>`, flags: 1 << 6 });
          return;
        }

        await ctx.defer();

        const data = await fetch(`http://api.qrserver.com/v1/read-qr-code/?fileurl=${qrURL}`)
          .then(res => res.json())
          .then(json => json[0].symbol[0].data)
          .catch(() => null);

        if (!data) {
          ctx.sendMessage({ content: ':x: Código QR inválido.', flags: 1 << 6 });
          return;
        }

        const ebd = new this.client.embed()
          .setTitle('<:qrcode:784833114761461800> Leitor de QR Code')
          .setColor('RANDOM')
          .setDescription(`:newspaper: **Texto:**\n\n\`\`\`\n${data}\`\`\``)
          .setThumbnail(qrURL)
          .setTimestamp()
          .setFooter(`${ctx.author.username}#${ctx.author.discriminator}`, dynamicAvatar(ctx.author));

        ctx.sendMessage({ embeds: [ebd] });
        break;
      default:
        ctx.sendMessage({ content: `:x: **Usa:** \`/qrcode <Criar/Ler> <Texto>|<URL/Anexo>\``, flags: 1 << 6 })
        break;
    }
  }
}