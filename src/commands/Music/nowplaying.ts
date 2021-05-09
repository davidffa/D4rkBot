import Command from '../../structures/Command';
import Client from '../../structures/Client';

import { Message, User } from 'eris';

import Canvas from 'canvas';
import fetch from 'node-fetch';
import { Parser } from 'xml2js';

import { resolve } from 'path';

export default class Nowplaying extends Command {
  constructor(client: Client) {
    super(client, {
      name: 'nowplaying',
      description: 'Mostra a música que está a tocar',
      category: 'Music',
      aliases: ['np'],
      cooldown: 5,
    });
  }

  async execute(message: Message): Promise<void> {
    if (message.channel.type !== 0) return;

    const player = this.client.music.players.get(message.guildID as string);

    if (!player || !player.queue.current) {
      message.channel.createMessage(':x: Não estou a tocar nada de momento!');
      return;
    }

    if (player.radio) {
      let artist, songTitle;
      const xmlParser = new Parser();
      
      if (['CidadeHipHop', 'CidadeFM', 'RadioComercial', 'M80'].includes(player.radio)) {
        const xml = await fetch(`https://${player.radio === 'M80' ? 'm80' : player.radio === 'RadioComercial' ? 'radiocomercial' : 'cidade'}.iol.pt/nowplaying${player.radio === 'CidadeHipHop' ? '_Cidade_HipHop' : ''}.xml`).then(r => r.text());

        const text = await xmlParser.parseStringPromise(xml).then(t => t.RadioInfo.Table[0]);

        artist = text['DB_DALET_ARTIST_NAME'][0];
        songTitle = text['DB_DALET_TITLE_NAME'][0];
      }else if (player.radio === 'RFM') {
        const xml = await fetch('https://configsa01.blob.core.windows.net/rfm/rfmOnAir.xml').then(r => r.buffer()).then(buffer => buffer.toString('utf16le'));

        const text = await xmlParser.parseStringPromise(xml).then(parsed => parsed.music.song[0]);
        
        artist = text.artist[0];
        songTitle = text.name[0];
      }

      if (artist && songTitle) {
        message.channel.createMessage(`:radio: A tocar a música \`${artist} - ${songTitle}\` na rádio \`${player.radio}\``);
        return;
      }

      message.channel.createMessage(`:radio: A tocar a rádio ${player.radio}`);
      return;
    }

    if (message.channel.permissionsOf(this.client.user.id).has('attachFiles')) {
      const canvas = Canvas.createCanvas(370, 410);
      const ctx = canvas.getContext('2d');

      const background = await Canvas.loadImage(resolve(__dirname, '..', '..', 'assets', 'npBackground.png'));

      ctx.fillStyle = '#363942';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(background, 0, 0, canvas.width, canvas.height);

      ctx.font = 'bold 20px Arial';
      ctx.fillStyle = '#eee';
      ctx.textAlign = 'center';
      ctx.fillText(player.queue.current.title.slice(0, 30), 185, 270, 300);

      if (player.queue.current.thumbnail && player.queue.current.displayThumbnail) {
        const buffer = await fetch(player.queue.current.displayThumbnail('maxresdefault')).then(res => res.buffer());

        const thumb = await Canvas.loadImage(buffer);
        ctx.drawImage(thumb, 70, 67, 240, 135);
      }

      const duration = this.client.utils.msToHour(player.queue.current.duration as number);

      const positionPercent = player.position / (player.queue.current.duration as number);

      ctx.font = 'bold 16px Arial';
      ctx.textAlign = 'start';
      ctx.fillStyle = '#ddd';
      ctx.fillText(this.client.utils.msToHour(player.position), 15, 323);
      ctx.fillText(duration, canvas.width - ctx.measureText(duration).width - 15, 323);

      ctx.beginPath();
      ctx.moveTo(15, 300);
      ctx.lineTo(canvas.width - 15, 300);
      ctx.lineWidth = 8;
      ctx.strokeStyle = '#333';
      ctx.stroke();

      const linearGradient = ctx.createLinearGradient(0, 0, 340, 0);
      linearGradient.addColorStop(0, '#6e0700');
      linearGradient.addColorStop(1, '#db0e00');

      if (positionPercent) {
        ctx.beginPath();
        ctx.moveTo(15, 300);
        ctx.lineTo((canvas.width - 15) * positionPercent, 300);
        ctx.lineWidth = 8;
        ctx.strokeStyle = linearGradient;
        ctx.stroke();
      }

      message.channel.createMessage('', {
        name: 'nowplaying.png',
        file: canvas.toBuffer()
      });
    } else if (message.channel.permissionsOf(this.client.user.id).has('embedLinks')) {
      const embed = new this.client.embed()
        .setColor('RANDOM')
        .setTitle('<a:disco:803678643661832233> A tocar')
        .setTimestamp()
        .setFooter(`${message.author.username}#${message.author.discriminator}`, message.author.dynamicAvatarURL());

      if (player.queue.current.uri) embed.setURL(player.queue.current.uri);
      const requester = player.queue.current.requester as User;
      embed.setDescription(`\`${player.queue.current.title}\` requisitado por \`${requester.username as string}#${requester.discriminator}\` com a duração de \`${this.client.utils.msToHour(player.position)}/${this.client.utils.msToHour(player.queue.current.duration as number)}\``);
      message.channel.createMessage({ embed });
    } else {
      message.channel.createMessage(':x: Preciso da permissão `Anexar Links` ou `Anexar arquivos` para executar este comando.');
    }
  }
}