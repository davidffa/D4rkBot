import Command from '../../structures/Command';
import Client from '../../structures/Client';
import CommandContext from '../../structures/CommandContext';

import { User } from 'eris';

import Canvas from 'canvas';

import { resolve } from 'path';

export default class Nowplaying extends Command {
  constructor(client: Client) {
    super(client, {
      name: 'nowplaying',
      description: 'Mostra a música que está a tocar.',
      category: 'Music',
      aliases: ['np'],
      cooldown: 5,
    });
  }

  async execute(ctx: CommandContext): Promise<void> {
    if (ctx.channel.type !== 0) return;

    const player = this.client.music.players.get(ctx.guild.id);

    if (!player || !player.current) {
      ctx.sendMessage({ content: ':x: Não estou a tocar nada de momento!', flags: 1 << 6 });
      return;
    }

    if (player.radio) {
      const { artist, songTitle } = await this.client.music.getRadioNowPlaying(player.radio);

      if (artist && songTitle) {
        ctx.sendMessage(`:radio: A tocar a música \`${artist} - ${songTitle}\` na rádio \`${player.radio}\``);
        return;
      }

      ctx.sendMessage(`:radio: A tocar a rádio ${player.radio}`);
      return;
    }

    if (ctx.channel.permissionsOf(this.client.user.id).has('attachFiles')) {
      const canvas = Canvas.createCanvas(370, 410);
      const canvasCtx = canvas.getContext('2d');

      const background = await Canvas.loadImage(resolve(__dirname, '..', '..', 'assets', 'npBackground.png'));

      canvasCtx.drawImage(background, 0, 0, canvas.width, canvas.height);

      canvasCtx.font = 'bold 20px Arial';
      canvasCtx.fillStyle = '#eee';
      canvasCtx.textAlign = 'center';
      canvasCtx.fillText(player.current.title.slice(0, 30), 185, 270, 300);

      if (player.current.thumbnail) {
        let url = player.current.thumbnail;

        let { buffer, status } = await this.client.request(url).then(async r => {
          return {
            buffer: await r.body.arrayBuffer(),
            status: r.statusCode
          }
        });

        if (status !== 200) buffer = await this.client.request(player.current.thumbnail).then(r => r.body.arrayBuffer());

        const thumb = await Canvas.loadImage(Buffer.from(buffer));
        canvasCtx.drawImage(thumb, 70, 67, 240, 135);
      }

      const duration = this.client.utils.msToHour(player.current.duration as number);

      const positionPercent = player.exactPosition / (player.current.duration as number);

      canvasCtx.font = 'bold 16px Arial';
      canvasCtx.textAlign = 'start';
      canvasCtx.fillStyle = '#ddd';
      canvasCtx.fillText(this.client.utils.msToHour(player.exactPosition), 15, 323);
      canvasCtx.fillText(duration, canvas.width - canvasCtx.measureText(duration).width - 15, 323);

      canvasCtx.beginPath();
      canvasCtx.moveTo(15, 300);
      canvasCtx.lineTo(canvas.width - 15, 300);
      canvasCtx.lineWidth = 8;
      canvasCtx.strokeStyle = '#333';
      canvasCtx.stroke();

      const linearGradient = canvasCtx.createLinearGradient(0, 0, 340, 0);
      linearGradient.addColorStop(0, '#440000');
      linearGradient.addColorStop(1, '#ff0000');

      if (positionPercent) {
        canvasCtx.beginPath();
        canvasCtx.moveTo(15, 300);
        canvasCtx.lineTo(Math.round((canvas.width - 30) * positionPercent + 15), 300);
        canvasCtx.lineWidth = 8;
        canvasCtx.strokeStyle = linearGradient;
        canvasCtx.stroke();
      }

      ctx.sendMessage({
        content: `<a:disco:803678643661832233> A tocar ${player.current.title}`,
        files: [
          {
            name: 'nowplaying.png',
            file: canvas.toBuffer()
          }
        ]
      });
    } else if (ctx.channel.permissionsOf(this.client.user.id).has('embedLinks')) {
      const embed = new this.client.embed()
        .setColor('RANDOM')
        .setTitle('<a:disco:803678643661832233> A tocar')
        .setTimestamp()
        .setFooter(`${ctx.author.username}#${ctx.author.discriminator}`, ctx.author.dynamicAvatarURL());

      if (player.current.uri) embed.setURL(player.current.uri);
      const requester = player.current.requester as User;
      embed.setDescription(`\`${player.current.title}\` requisitado por \`${requester.username as string}#${requester.discriminator}\` com a duração de \`${this.client.utils.msToHour(player.exactPosition)}/${this.client.utils.msToHour(player.current.duration as number)}\``);
      ctx.sendMessage({ embeds: [embed] });
    } else {
      ctx.sendMessage({ content: ':x: Preciso da permissão `Anexar Links` ou `Anexar arquivos` para executar este comando.', flags: 1 << 6 });
    }
  }
}