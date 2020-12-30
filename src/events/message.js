const Discord = require('discord.js');
const guildDB = require('../models/guildDB');
const botDB = require('../models/botDB');
const fs = require('fs');

const cooldowns = new Discord.Collection();

module.exports.run = async (client, message) => {
    let guild;
    if (message.channel.type === 'text') {
        const startDB = process.hrtime();
        guild = await guildDB.findOne({ guildID: message.guild.id });
        const stopDB = process.hrtime(startDB);
        message.guildDB = guild;
        message.pingDB = Math.round(((stopDB[0] * 1e9) + stopDB[1]) / 1e6);
    }
    const prefix = guild && guild.prefix ? guild.prefix : "db.";

    if (new RegExp(`^<@!?${client.user.id}>$`).test(message.content))
        return message.channel.send(`<a:lab_bloblegal:643912893246603314> Olá <@${message.author.id}> O meu prefixo neste servidor é \`${prefix}\`. Faz \`${prefix}help\` para veres o que posso fazer!`);

    if (!message.content.startsWith(prefix) || message.author.bot) return;

    //if (message.author.id !== '334054158879686657') return message.channel.send(":x: Bot em manutenção!");

    const args = message.content.slice(prefix.length).split(/ +/);
    const commandName = args.shift().toLowerCase();

    const command = client.commands.get(commandName)
        || client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));

    if (!command) {
        let cmds = message.author.id === '334054158879686657' 
            ? client.commands.map(cmd => cmd.name) 
            : client.commands.filter(cmd => cmd.category !== 'Desenvolvedor').map(cmd => cmd.name);

        client.commands.forEach(cmd => {
            if (!cmd.aliases || (message.author.id !== '334054158879686657' && cmd.category === 'Desenvolvedor')) return;
            cmds = cmds.concat(cmd.aliases)
        })

        let diduMean = '';
        let diduMeanLevel = Infinity;

        cmds.forEach(cmd => {
            levDistance = client.utils.levenshteinDistance(commandName, cmd)
            if (levDistance < diduMeanLevel) {
                diduMean = cmd;
                diduMeanLevel = levDistance;
            }
        });

        const msg = await message.channel.send(`:x: Eu não tenho esse comando.\n:thinking: Querias dizer \`${prefix}${diduMean}\`?`);
        msg.react('<:shell:777546055952498708>');

        const filter = (_r, u) => u.id === message.author.id;
        const collector = msg.createReactionCollector(filter, { max: 1, time: 10 * 1000 });

        collector.on('collect', async r => {
            switch (r.emoji.name) {
                case 'shell':
                    message.content = message.content.replace(`${commandName}`, `${diduMean}`)
                    client.emit('message', message)
                    msg.delete();
                    break;
            }
        });

        setTimeout(() => {
            if (!msg.deleted)
                msg.delete();
        }, 10000)
        return;
    }

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
            return message.reply(`Espera mais \`${timeLeft.toFixed(1)}\` segundos para voltares a usar o comando \`${command.name}\``);
        }
    }

    if ((args.length >= command.args) || !command.args) {
        timestamps.set(message.author.id, now);
        setTimeout(() => timestamps.delete(message.author.id), cooldownAmount);
    }

    if ((command.args && !args.length) || args.length < command.args) {
        let reply = `:x: Argumentos em falta! `;

        if (command.usage) {
            reply += `**Usa:** \`${prefix}${commandName} ${command.usage}\``;
        }

        return message.channel.send(reply);
    }

    try {
        command.execute(client, message, args, prefix);
        
        //Logs
        if (!fs.existsSync('./logs'))
            fs.mkdirSync('./logs');

        if (message.channel.type === 'text') 
            fs.appendFileSync('./logs/latest.txt', `**Comando:** \`${commandName}\` executado no servidor \`${message.guild.name}\`\n**Args:** \`[${args.join(' ')}]\`\n**User:** ${message.author.tag}\n\n`)
    
        //Cmd counter
        const cmdsUsed = await botDB.findOne({ botID: client.user.id });
        ++cmdsUsed.commands;
        cmdsUsed.save();
    } catch (err) {
        message.channel.send(`:x: Ocorreu um erro ao executar o comando \`${commandName}\``);
        console.error(err.message);

        if (message.channel.type === 'text') {
            const embed = new Discord.MessageEmbed().setTitle(':x: Ocorreu um erro!')
                .setColor('RANDOM')
                .setDescription(`Ocorreu um erro ao executar o comando \`${commandName}\` no servidor \`${message.guild.name}\`\n**Args:** \`[${args.join(' ')}]\`\n**Erro:** \`${err.message}\``)
                .setFooter(`${message.author.tag}`, message.author.displayAvatarURL({ dynamic: true }))
                .setTimestamp()

            client.users.cache.get('334054158879686657').send(embed);
        }
    }
}