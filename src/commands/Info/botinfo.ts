import Command from '../../structures/Command';
import Client from '../../structures/Client';

import { Message, VERSION } from 'eris';

import os from 'os';
import moment from 'moment';
moment.locale('pt');

export default class Botinfo extends Command {
  constructor(client: Client) {
    super(client, {
      name: 'botinfo',
      description: 'Informações sobre mim',
      category: 'Info',
      aliases: ['info', 'bi'],
      cooldown: 10
    });
  }

  async execute(message: Message): Promise<void> {
    if (message.channel.type !== 0) return;

    if (!message.channel.permissionsOf(this.client.user.id).has('embedLinks')) {
      message.channel.createMessage(':x: Preciso da permissão `Anexar Links` para executar este comando');
      return;
    }

    const cpuUsage = await getCpuUsage();
    const cpuName = os.cpus()[0].model;
    const totalCmdsUsed = this.client.commandsUsed;

    const startDB = process.hrtime();
    await this.client.botDB.findOne({ botID: this.client.user.id });
    const stopDB = process.hrtime(startDB);
    const pingDB = Math.round(((stopDB[0] * 1e9) + stopDB[1]) / 1e6);

    const WSPing = (this.client.shards.get(0)?.latency) || 0;
    const embed = new this.client.embed()
      .setColor('RANDOM')
      .setTitle('<a:blobdance:804026401849475094> Informações sobre mim')
      .setDescription('**[Convite](https://discord.com/oauth2/authorize?client_id=499901597762060288&scope=bot&permissions=8)**\n' +
        '**[Servidor de Suporte](https://discord.gg/dBQnxVCTEw)**\n\n' +
        `Modelo da CPU: \`${cpuName}\`\nTotal de comandos usados: \`${totalCmdsUsed}\``
      )
      .addField(':calendar: Criado em', `\`${moment(this.client.user.createdAt).format('L')} (${moment(this.client.user.createdAt).startOf('day').fromNow()})\``, true)
      .addField(':id: Meu ID', '`499901597762060288`', true)
      .addField(':man: Dono', '`D4rkB#2408`', true)
      .addField('<a:infinity:838759634361253929> Uptime', `\`${this.client.utils.msToDate(process.uptime() * 1e3)}\``, true)
      .addField(':desktop: Servidores em que estou', `\`${this.client.guilds.size}\``, true)
      .addField(':ping_pong: Ping da API', `\`${Math.round(WSPing)}ms\``, true)
      .addField('<:badgehypesquad:803665497223987210> Prefixos', `Padrão: \`db.\`\nNo servidor: \`${this.client.guildCache.get(message.guildID as string)?.prefix}\``, true)
      .addField('<:lang_js:803678540528615424> Versão NodeJS', `\`${process.version}\``, true)
      .addField('<a:blobdiscord:803989275619754014> Versão do Eris', `\`v${VERSION}\``, true)
      .addField('<:MongoDB:773610222602158090>Banco de dados', `_MongoDB_\nPing: \`${pingDB}ms\``, true)
      .addField('<a:loading:804026048647659540> CPU', `\`${cpuUsage}%\``, true)
      .addField('<:ram:751468688686841986> RAM', `\`${(process.memoryUsage().rss / 1024 / 1024).toFixed(0)}MB\``, true)
      .setThumbnail(this.client.user.dynamicAvatarURL())
      .setTimestamp()
      .setFooter(`${message.author.username}#${message.author.discriminator}`, message.author.dynamicAvatarURL());

    message.channel.createMessage({ embed });
  }
}

const cpuAverage = () => {
  let totalIdle = 0;
  let totalTick = 0;
  const cpus = os.cpus();

  for (var i = 0, len = cpus.length; i < len; i++) {
    const cpu = cpus[i];
    const cpuTimes = cpu.times as any;
    for (const type in cpuTimes) {
      totalTick += cpuTimes[type];
    }
    totalIdle += cpuTimes.idle;
  }

  return {
    avgIdle: (totalIdle / cpus.length),
    avgTotal: (totalTick / cpus.length)
  }
}

const getCpuUsage = async () => {
  return new Promise((resolve) => {
    const startMeasure = cpuAverage();

    setTimeout(() => {
      const endMeasure = cpuAverage();
      const idleDifference = endMeasure.avgIdle - startMeasure.avgIdle;
      const totalDifference = endMeasure.avgTotal - startMeasure.avgTotal;
      const cpuPercentage = (10000 - Math.round(10000 * idleDifference / totalDifference)) / 100;

      resolve(cpuPercentage);
    }, 1000);
  })
}