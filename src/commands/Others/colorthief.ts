import Command from '../../structures/Command';
import Client from '../../structures/Client';
import CommandContext from '../../structures/CommandContext';

import { createCanvas } from 'canvas';
import { getPaletteFromURL } from 'color-thief-node';

import { getImageSize } from '../../utils/imageUtil';

type Color = {
  hex: string;
  index: number;
}

export default class ColorThief extends Command {
  constructor(client: Client) {
    super(client, {
      name: 'colorthief',
      description: 'Mostra a paleta de cores de uma imagem.',
      usage: '<URL/Anexo>',
      category: 'Others',
      aliases: ['colorpalette'],
      cooldown: 4
    });
  }

  async execute(ctx: CommandContext) {
    if (ctx.channel.type === 0 && !ctx.channel.permissionsOf(this.client.user.id).has('ATTACH_FILES')) {
      ctx.sendMessage({ content: ':x: Preciso da permissão `Anexar Arquivos` para executar este comando', flags: 1 << 6 });
      return;
    }

    const url = ctx.attachments?.[0]?.url ?? ctx.args[0];

    if (!url) {
      ctx.sendMessage(`:x: Argumentos em falta. **Usa:** \`/${this.name} ${this.usage}\``);
      return;
    }

    try {
      const imgBuf = await this.client.request(url).then(async r => Buffer.from(await r.body.arrayBuffer()));
      const imgSize = getImageSize(imgBuf);

      if (!imgSize) {
        ctx.sendMessage(':x: Imagem inválida! Formatos aceites: PNG, JPG, JPEG');
        return;
      }

      if (imgSize.width * imgSize.height > 2_000_000) {
        ctx.sendMessage({ content: ":x: A imagem é muito grande! (Tamanho máximo 2000000px)", flags: 1 << 6 });
        return;
      }
    } catch {
      ctx.sendMessage(':x: URL/Imagem inválida!');
    }

    const palette = await getPaletteFromURL(url, 8);

    const paletteHex = palette.reduce((acc: Color[], [r, g, b], i) => {
      const hex = `#${(r << 16 | g << 8 | b).toString(16).padStart(6, '0')}`.toUpperCase();

      if (acc.every(it => it.hex !== hex)) acc.push({ hex, index: i });
      return acc;
    }, []);

    const canvas = createCanvas(150 * paletteHex.length, 450);
    const canvasCtx = canvas.getContext('2d');

    for (let i = 0; i < paletteHex.length; i++) {
      const [r, g, b] = palette[paletteHex[i].index];

      canvasCtx.fillStyle = paletteHex[i].hex;
      canvasCtx.fillRect(150 * i, 0, 150, 450);

      canvasCtx.fillStyle = (r * 0.299 + g * 0.587 + b * 0.114) > 186 ? '#323232' : '#EDEDED';

      canvasCtx.font = 'bold 26px Arial';
      canvasCtx.textAlign = 'center';

      canvasCtx.fillText(paletteHex[i].hex, 150 * i + 75, 425);
    }

    ctx.sendMessage({
      content: ':art: Paleta de cores da imagem',
      files: [{
        contents: canvas.toBuffer(),
        name: 'palette.png'
      }]
    });
  }
}