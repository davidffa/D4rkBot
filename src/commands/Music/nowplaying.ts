import Command from '../../structures/Command';
import Client from '../../structures/Client';
import CommandContext from '../../structures/CommandContext';

import { User } from 'eris';

import Canvas from 'canvas';
import fetch from 'node-fetch';

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

    const player = this.client.music.players.get(ctx.msg.guildID as string);

    if (!player || !player.queue.current) {
      ctx.sendMessage(':x: Não estou a tocar nada de momento!');
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

      canvasCtx.fillStyle = '#363942';
      canvasCtx.fillRect(0, 0, canvas.width, canvas.height);
      canvasCtx.drawImage(background, 0, 0, canvas.width, canvas.height);

      canvasCtx.font = 'bold 20px Arial';
      canvasCtx.fillStyle = '#eee';
      canvasCtx.textAlign = 'center';
      canvasCtx.fillText(player.queue.current.title.slice(0, 30), 185, 270, 300);

      if (player.queue.current.thumbnail && player.queue.current.displayThumbnail) {
        const buffer = await fetch(player.queue.current.displayThumbnail('maxresdefault')).then(res => res.buffer());

        const thumb = await Canvas.loadImage(buffer);
        canvasCtx.drawImage(thumb, 70, 67, 240, 135);
      }

      const duration = this.client.utils.msToHour(player.queue.current.duration as number);

      const positionPercent = player.position / (player.queue.current.duration as number);

      canvasCtx.font = 'bold 16px Arial';
      canvasCtx.textAlign = 'start';
      canvasCtx.fillStyle = '#ddd';
      canvasCtx.fillText(this.client.utils.msToHour(player.position), 15, 323);
      canvasCtx.fillText(duration, canvas.width - canvasCtx.measureText(duration).width - 15, 323);

      canvasCtx.beginPath();
      canvasCtx.moveTo(15, 300);
      canvasCtx.lineTo(canvas.width - 15, 300);
      canvasCtx.lineWidth = 8;
      canvasCtx.strokeStyle = '#333';
      canvasCtx.stroke();

      const linearGradient = canvasCtx.createLinearGradient(0, 0, 340, 0);
      linearGradient.addColorStop(0, '#6e0700');
      linearGradient.addColorStop(1, '#db0e00');

      if (positionPercent) {
        canvasCtx.beginPath();
        canvasCtx.moveTo(15, 300);
        canvasCtx.lineTo((canvas.width - 15) * positionPercent, 300);
        canvasCtx.lineWidth = 8;
        canvasCtx.strokeStyle = linearGradient;
        canvasCtx.stroke();
      }

      ctx.sendMessage(`<a:disco:803678643661832233> A tocar ${player.queue.current.title}`, {
        name: 'nowplaying.png',
        file: canvas.toBuffer()
      });
    } else if (ctx.channel.permissionsOf(this.client.user.id).has('embedLinks')) {
      const embed = new this.client.embed()
        .setColor('RANDOM')
        .setTitle('<a:disco:803678643661832233> A tocar')
        .setTimestamp()
        .setFooter(`${ctx.author.username}#${ctx.author.discriminator}`, ctx.author.dynamicAvatarURL());

      if (player.queue.current.uri) embed.setURL(player.queue.current.uri);
      const requester = player.queue.current.requester as User;
      embed.setDescription(`\`${player.queue.current.title}\` requisitado por \`${requester.username as string}#${requester.discriminator}\` com a duração de \`${this.client.utils.msToHour(player.position)}/${this.client.utils.msToHour(player.queue.current.duration as number)}\``);
      ctx.sendMessage({ embed });
    } else {
      ctx.sendMessage(':x: Preciso da permissão `Anexar Links` ou `Anexar arquivos` para executar este comando.');
    }
  }
}