import Command from '../../structures/Command';
import Client from '../../structures/Client';
import CommandContext from '../../structures/CommandContext';

import { resolve } from 'path';

import Canvas from 'canvas';
import { getPaletteFromURL } from 'color-thief-node';

export default class Spotify extends Command {
  constructor(client: Client) {
    super(client, {
      name: 'spotify',
      description: 'Mostra uma imagem da música de Spotify do status de alguém.',
      usage: '[Nome/ID]',
      category: 'Others',
      cooldown: 5
    });
  }

  async execute(ctx: CommandContext): Promise<void> {
    if (ctx.channel.type === 0 && !ctx.channel.permissionsOf(this.client.user.id).has('attachFiles')) {
      ctx.sendMessage({ content: ':x: Preciso da permissão `Anexar Arquivos` para executar este comando', flags: 1 << 6 });
      return;
    }

    let member = ctx.member;

    if (ctx.args[0]) {
      const user = await this.client.utils.findUser(ctx.args.join(' '), ctx.guild);
      member = ctx.guild.members.get(user?.id ?? '');

      if (!member) {
        ctx.sendMessage({ content: ':x: Membro não encontrado!', flags: 1 << 6 });
        return;
      }
    }

    const activity = ctx.member?.activities?.find(a => a.name === 'Spotify');

    if (!activity) {
      ctx.sendMessage({ content: ':x: Esse membro não está a ouvir nada no spotify!', flags: 1 << 6 });
      return;
    }

    const canvas = Canvas.createCanvas(950, 350);
    const canvasCtx = canvas.getContext('2d');

    const spotifyImg = await Canvas.loadImage(`https://i.scdn.co/image/${activity.assets!.large_image!.split(':')[1]}`);
    const palette = await getPaletteFromURL(`https://i.scdn.co/image/${activity.assets!.large_image!.split(':')[1]}`);

    canvasCtx.drawImage(spotifyImg, 0, 0, 350, 350)

    const gradient = canvasCtx.createLinearGradient(350, 0, 350, 950);

    gradient.addColorStop(0, `rgba(${palette[0][0]}, ${palette[0][1]}, ${palette[0][2]}, 0.3)`);
    gradient.addColorStop(1, `rgba(${palette[1][0]}, ${palette[1][1]}, ${palette[1][2]}, 0.3)`);

    canvasCtx.fillStyle = gradient;
    canvasCtx.fillRect(350, 0, 600, 350);

    const spotifyIcon = await Canvas.loadImage(String(resolve(__dirname, '..', '..', 'assets', 'spotifyIcon.png')));
    canvasCtx.drawImage(spotifyIcon, canvas.width - (15 + 189), 15, 189, 60);

    const spotifyButtons = await Canvas.loadImage(String(resolve(__dirname, '..', '..', 'assets', 'spotifyButtons.png')));
    canvasCtx.drawImage(spotifyButtons, (350 + canvas.width) / 2 - 160, canvas.height - 95, 320, 80);

    // setup text
    canvasCtx.font = 'bold 32px Arial';
    canvasCtx.textAlign = 'start';
    canvasCtx.fillStyle = '#e2e2e2';

    let title = activity.details!;
    let artist = activity.state!;

    if (title.length > 50) title = `${title.slice(0, 47)}...`;
    if (artist.length > 75) title = `${title.slice(0, 72)}...`;

    canvasCtx.fillText(title, 400, 115, 500);

    canvasCtx.font = 'italic 16px Arial';
    canvasCtx.fillText(artist, 400, 165, 500);

    const duration = activity.timestamps!.end! - activity.timestamps!.start;
    const current = Date.now() - activity.timestamps!.start

    const durationStr = this.client.utils.msToHour(duration);

    const progress = current / duration;

    const progressBarGradient = canvasCtx.createLinearGradient(0, 0, 500, 0);

    progressBarGradient.addColorStop(0, `rgb(0, 90, 35)`);
    progressBarGradient.addColorStop(1, `rgb(30, 215, 96)`);

    // ProgressBar itself
    canvasCtx.beginPath();
    canvasCtx.moveTo(400, canvas.height - 110);
    canvasCtx.lineTo((canvas.width - 450) * progress + 400 - 5, canvas.height - 110); // 5px because of circle
    canvasCtx.lineWidth = 6;
    canvasCtx.strokeStyle = progressBarGradient;
    canvasCtx.stroke();

    // rest of progressbar (blank space)
    canvasCtx.beginPath();
    canvasCtx.moveTo((canvas.width - 450) * progress + 400 + 5, canvas.height - 110);
    canvasCtx.lineTo(900, canvas.height - 110);
    canvasCtx.lineWidth = 6;
    canvasCtx.strokeStyle = `rgba(83, 83, 83, 0.7)`;
    canvasCtx.stroke();

    // circle on tip of the progress bar
    canvasCtx.beginPath();
    canvasCtx.strokeStyle = 'rgb(30, 215, 96)';
    canvasCtx.arc((canvas.width - 450) * progress + 400, canvas.height - 110, 5, 0, 2 * Math.PI);
    canvasCtx.stroke();

    // times
    canvasCtx.font = 'bold 16px Arial';
    canvasCtx.fillText(this.client.utils.msToHour(current), 400, canvas.height - 85);
    canvasCtx.fillText(durationStr, canvas.width - canvasCtx.measureText(durationStr).width - 50, canvas.height - 85);

    ctx.sendMessage({
      files: [
        {
          name: 'Spotify.png',
          file: canvas.toBuffer()
        }
      ]
    });
  }
}