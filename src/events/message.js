const Discord = require('discord.js');
const guildDB = require('../models/guildDB');

const cooldowns = new Discord.Collection();

module.exports.run = async (client, message) => {
    let guild;
    if (message.channel.type === 'text') {
        guild = await guildDB.findOne({ guildID: message.guild.id });
    }
    const prefix = guild && guild.prefix ? guild.prefix : "db.";

    if (message.mentions.members && message.mentions.members.has(client.user.id) && message.content.split(' ').length === 1) 
        return message.channel.send(`<a:lab_bloblegal:643912893246603314> Olá <@${message.author.id}> O meu prefixo neste servidor é \`${prefix}\`. Faz \`${prefix}help\` para veres o que posso fazer!`);

    if (!message.content.startsWith(prefix) || message.author.bot) return;

    //if (message.author.id !== '334054158879686657') return message.channel.send(":x: Bot em manutenção!");

    const args = message.content.slice(prefix.length).split(/ +/);
    const commandName = args.shift().toLowerCase();

    const command = client.commands.get(commandName) 
        || client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));
    
    if (!command) return;

    if (command.guildOnly && message.channel.type !== 'text') {
        return message.reply(':x: Não posso executar esse comando nas DMs!');
    }

    if (guild && guild.disabledCmds && guild.disabledCmds.includes(command.name))
        return message.channel.send(`:x: O comando \`${command.name}\` está desativado neste servidor.`);

    if (!cooldowns.has(command.name)) {
        cooldowns.set(command.name, new Discord.Collection());
    }

    const now = Date.now();
    const timestamps = cooldowns.get(command.name);
    const cooldownAmount = (command.cooldown || 3) * 1000;

    if (timestamps.has(message.author.id) && message.author.id !== '334054158879686657') {
        const expirationTime = timestamps.get(message.author.id) + cooldownAmount;

        if (now < expirationTime) {
            const timeLeft = (expirationTime - now) / 1000;
            return message.reply(`Espera mais \`${timeLeft.toFixed(1)}\` segundos para voltares a usar o comando \`${command.name}\``).then(msg => msg.delete({ timeout: timeLeft*1000 }));
        }
    }

    if ((args.length >= command.args) || !command.args) {
        timestamps.set(message.author.id, now);
        setTimeout(() => timestamps.delete(message.author.id), cooldownAmount);
    }

    if ((command.args && !args.length) ||args.length < command.args) {
        let reply = `:x: Argumentos em falta! `;

        if (command.usage) {
            reply += `**Usa:** \`${prefix}${commandName} ${command.usage}\``;
        }
        
        return message.channel.send(reply);
    }

    try {
        command.execute(client, message, args, prefix);
    } catch (err) {
        message.channel.send(`:x: Ocorreu um erro ao executar o comando \`${commandName}\``);
        console.error(err.message);
    }
}