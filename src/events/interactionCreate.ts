import Client from '../structures/Client';
import Interaction from '../structures/Interaction';
import CommandContext from '../structures/CommandContext';

import { existsSync, appendFileSync, mkdirSync } from 'fs';

export default class InteractionCreate {
  client: Client;

  constructor(client: Client) {
    this.client = client;
  }

  async run(interaction: Interaction) {
    // if (interaction.type);

    const cmd = this.client.commands.find(c => c.name === interaction.command);
    if (!cmd) throw new Error('Command not found!');

    const ctx = new CommandContext(this.client, interaction);

    if (!this.client.cooldowns.has(cmd.name))
      this.client.cooldowns.set(cmd.name, new Map<string, number>());

    const now = Date.now();
    const timestamps = this.client.cooldowns.get(cmd.name);
    const cooldownAmount = (cmd.cooldown || 3) * 1000;

    if (timestamps && timestamps.has(interaction.author.id) && interaction.author.id !== '334054158879686657') {
      const expirationTime = timestamps.get(interaction.author.id) as number + cooldownAmount;

      if (now < expirationTime) {
        const timeLeft = (expirationTime - now) / 1000;
        return ctx.sendMessage(`:clock1: Espera mais \`${timeLeft.toFixed(1)}\` segundos para voltares a usar o comando \`${cmd.name}\``);
      }
    }

    if (timestamps) {
      timestamps.set(interaction.author.id, now);
      setTimeout(() => timestamps.delete(interaction.author.id), cooldownAmount);
    }

    try {
      cmd.execute(ctx);

      //Logs
      if (!existsSync('./logs'))
        mkdirSync('./logs');

      appendFileSync('./logs/log.txt', `**Slash Command:** \`${cmd.name}\` executado no servidor \`${ctx.guild?.name}\`\n**Args:** \`[${ctx.args?.join(' ')}]\`\n**User:** ${ctx.author.username}#${ctx.author.discriminator}(${ctx.author.id})\n\n`);

      this.client.commandsUsed++;
    } catch (err) {
      ctx.sendMessage(`:x: Ocorreu um erro ao executar o comando \`${cmd.name}\``);
      console.error(err.message);

      const embed = new this.client.embed()
        .setTitle(':x: Ocorreu um erro!')
        .setColor('8B0000')
        .setDescription(`Ocorreu um erro ao executar o comando \`${cmd.name}\` no servidor \`${ctx.guild?.name}\`\n**Args:** \`[${ctx.args?.join(' ')}]\`\n**Erro:** \`${err.message}\``)
        .setFooter(`${ctx.author.username}#${ctx.author.discriminator}`, ctx.author.dynamicAvatarURL())
        .setTimestamp();

      this.client.createMessage('334054158879686657', { embed });
    }
  }
}