import Client from '../structures/Client';
import { ComponentCollector } from '../structures/Collector';
import CommandContext from '../structures/CommandContext';

import { Message, ActionRowComponents, ActionRow, ComponentInteraction } from 'eris';
import { appendFileSync, existsSync, mkdirSync } from 'fs';

export default class MessageCreate {
  client: Client;

  constructor(client: Client) {
    this.client = client;
  }

  async run(message: Message) {
    for (const collector of this.client.messageCollectors) {
      if (collector.channel.id === message.channel.id) {
        collector.collect(message);
      }
    }

    if (message.author.bot || message.channel.type === 1 || !this.client.cacheLoaded) return;

    if (message.guildID) {
      if ((this.client.guilds.get(message.guildID)!.members.get(this.client.user.id)!.communicationDisabledUntil ?? 0) > Date.now()) return;
    }

    const prefix = (this.client.guildCache.get(message.guildID as string)?.prefix) || 'db.';

    if (new RegExp(`^<@!?${this.client.user.id}>$`).test(message.content)) {
      if (message.channel.type === 0) {
        if (!message.channel.permissionsOf(this.client.user.id).has('sendMessages')) return;
        if (this.client.blacklist.includes(message.author.id)) {
          message.channel.createMessage(':x: Estás na minha blacklist, por isso não podes usar nenhum comando meu!\nSe achas que foi injusto contacta o meu dono no meu servidor de suporte: <https://discord.gg/dBQnxVCTEw>');
          return;
        }
        return message.channel.createMessage(`<a:blobcool:804026346954555432> Olá ${message.author.mention} O meu prefixo neste servidor é \`${prefix}\`. Faz \`${prefix}help\` para veres o que posso fazer!`)
      } else {
        return message.channel.createMessage(`<a:blobcool:804026346954555432> Olá ${message.author.mention} O meu prefixo é \`${prefix}\`. Faz \`${prefix}help\` para veres o que posso fazer!`)
      }
    }

    if (!message.content.startsWith(prefix)) return;

    if (this.client.blacklist.includes(message.author.id)) {
      if (message.channel.type === 0 && message.channel.permissionsOf(this.client.user.id).has('sendMessages')) {
        message.channel.createMessage(':x: Estás na minha blacklist, por isso não podes usar nenhum comando meu!\nSe achas que foi injusto contacta o meu dono no meu servidor de suporte: <https://discord.gg/dBQnxVCTEw>');
      }
      return;
    }

    const args = message.content.slice(prefix.length).split(/ +/);
    const cmdName = args.shift()?.toLowerCase();

    if (!cmdName) return;

    const command = this.client.commands.filter(c => message.author.id === '334054158879686657' || c.category !== 'Dev').find(c => c.name === cmdName || c.aliases?.includes(cmdName));

    if (!command) {
      if (!this.client.guildCache.get(message.guildID as string)?.didUMean) return;
      if (message.channel.type === 0 && !message.channel.permissionsOf(this.client.user.id).has('sendMessages')) return;
      let cmds: string[] = [];

      this.client.commands.forEach(cmd => {
        if (cmd.category === 'Dev') {
          if (message.author.id === '334054158879686657') {
            cmds.push(cmd.name);
            if (cmd.aliases) cmds = cmds.concat(cmd.aliases);
          }
        } else {
          cmds.push(cmd.name);
          if (cmd.aliases) cmds = cmds.concat(cmd.aliases);
        }
      });

      let diduMean = '';
      let levDistanceLevel = Infinity;

      cmds.forEach(cmd => {
        const levDistance = this.client.utils.levenshteinDistance(cmdName, cmd);

        if (levDistance < levDistanceLevel) {
          diduMean = cmd;
          levDistanceLevel = levDistance;
        }
      });

      const components: ActionRowComponents[] = [
        {
          custom_id: 'run',
          style: 1,
          type: 2,
          label: 'Executar',
          emoji: {
            id: '777546055952498708',
            name: 'shell',
          }
        },
      ]

      const row: ActionRow = {
        type: 1,
        components
      }

      const msg = await message.channel.createMessage({
        content: `:x: Eu não tenho esse comando.\n:thinking: Querias dizer \`${prefix}${diduMean}\`?`,
        components: [row]
      });

      const filter = (i: ComponentInteraction) => i.member!.id === message.author.id;

      const collector = new ComponentCollector(this.client, msg, filter, { max: 1, time: 5 * 1000 });

      collector.on('collect', () => {
        message.content = `${prefix}${diduMean} ${args.join(' ')}`.trim();
        this.client.emit('messageCreate', message);
      });

      collector.on('end', (r) => {
        if (r === 'Time' || r === 'Max')
          msg.delete();
      });

      return;
    }

    if (command.name !== 'unlock' && message.channel.type === 0 && !message.channel.permissionsOf(this.client.user.id).has('sendMessages')) return;

    if (this.client.lockedCmds.includes(command.name) && message.author.id !== '334054158879686657' && message.channel.type === 0 && message.channel.permissionsOf(this.client.user.id).has('sendMessages'))
      return message.channel.createMessage(`:x: O comando \`${cmdName}\` está em manutenção.`);

    if (message.channel.type === 0 && this.client.guildCache.get(message.guildID as string)?.disabledCmds.includes(command.name) && message.channel.permissionsOf(this.client.user.id).has('sendMessages'))
      return message.channel.createMessage(`:x: O comando \`${command.name}\` está desativado neste servidor.`);

    if (!this.client.cooldowns.has(command.name))
      this.client.cooldowns.set(command.name, new Map<string, number>());

    const now = Date.now();
    const timestamps = this.client.cooldowns.get(command.name);
    const cooldownAmount = (command.cooldown || 3) * 1000;

    if (timestamps && timestamps.has(message.author.id) && message.author.id !== '334054158879686657') {
      const expirationTime = timestamps.get(message.author.id) as number + cooldownAmount;

      if (now < expirationTime) {
        const timeLeft = (expirationTime - now) / 1000;
        return message.channel.createMessage(`:clock1: Espera mais \`${timeLeft.toFixed(1)}\` segundos para voltares a usar o comando \`${command.name}\``);
      }
    }

    if (command.args && (args.length < command.args)) {
      let reply = `:x: Argumentos em falta! `;

      if (command.usage) reply += `**Usa:** \`${prefix}${cmdName} ${command.usage}\``;

      return message.channel.createMessage(reply);
    }

    if (timestamps) {
      timestamps.set(message.author.id, now);
      setTimeout(() => timestamps.delete(message.author.id), cooldownAmount);
    }

    try {
      const ctx = new CommandContext(this.client, message, args);
      command.execute(ctx);

      this.client.commandsUsed++;

      if (process.env.NODE_ENV !== 'production') return;

      //Logs
      if (!existsSync('./logs'))
        mkdirSync('./logs');

      if (message.channel.type === 0)
        appendFileSync('./logs/log.txt', `Comando: \`${cmdName}\` executado no servidor \`${message.channel.guild.name}\`\nArgs: \`${args.join(' ')}\`\nUser: ${message.author.username}#${message.author.discriminator} (${message.author.id})\n\n`);
    } catch (err: any) {
      message.channel.createMessage(`:x: Ocorreu um erro ao executar o comando \`${cmdName}\``);
      console.error(err.message);

      if (message.channel.type === 0) {
        const embed = new this.client.embed()
          .setTitle(':x: Ocorreu um erro!')
          .setColor('8B0000')
          .setDescription(`Ocorreu um erro ao executar o comando \`${cmdName}\` no servidor \`${message.channel.guild.name}\`\nArgs: \`${args.join(' ')}\`\nErro: \`${err.message}\``)
          .setFooter(`${message.author.username}#${message.author.discriminator}`, message.author.dynamicAvatarURL())
          .setTimestamp();

        this.client.createMessage('334054158879686657', { embeds: [embed] });
      }
    }
  }
}