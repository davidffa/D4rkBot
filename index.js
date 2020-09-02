require('dotenv').config();
const fs = require('fs');
const Discord = require('discord.js');
const mongoose = require('mongoose');
const prefixdb = require('./models/prefixdb');
const welcomedb = require("./models/welcomedb");
const roledb = require('./models/roledb');
const Canvas = require('canvas');
const path = require('path');

const client = new Discord.Client();
client.commands = new Discord.Collection();
const cooldowns = new Discord.Collection();

mongoose.connect(`mongodb+srv://d4rkb:${process.env.dbpassword}@d4rkbotjs-7ttdo.gcp.mongodb.net/main?retryWrites=true&w=majority`, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    client.commands.set(command.name, command);
}

client.once('ready', () => {
    console.log("D4rkBot iniciado");
    console.log(`Utilizadores: ${client.users.cache.size} \nServidores: ${client.guilds.cache.size}`)
    client.user.setActivity("D4rkB", {type: "WATCHING"});
});

client.on('guildMemberAdd', async member => {
    const guildExists = await roledb.findOne({ guildID: member.guild.id });
    if (guildExists && member.guild.member(client.user.id).hasPermission('MANAGE_ROLES')) {
        const role = member.guild.roles.cache.get(guildExists.roleID);
        member.roles.add(role).catch(console.log);
    }

    const applyText = (canvas, text) => {
        const ctx = canvas.getContext("2d");
        let fontSize = 70;

        do {
            ctx.font = `${fontSize -= 10}px sans-serif`;
        }while (ctx.measureText(text).width > canvas.width - 300);
        return ctx.font;
    }

    const guildExists2 = await welcomedb.findOne({ guildID: member.guild.id });
    if (guildExists2) {
        const chat = guildExists2.chatID;
        const canvas = Canvas.createCanvas(700, 250);
        const ctx = canvas.getContext("2d");
        
        const background = await Canvas.loadImage(String(path.resolve(__dirname, 'assets', 'wallpaper.png')));
        ctx.drawImage(background, 0, 0, canvas.width, canvas.height);

        ctx.strokeStyle = "#74037b";
        ctx.strokeRect(0, 0, canvas.width, canvas.height);

        ctx.font = "28px sans-serif";
        ctx.fillStyle = "#ffffff";
        ctx.fillText("Bem-Vindo, ", canvas.width / 2.5, canvas.height / 3.5);
        ctx.font = applyText(canvas, member.displayName);
        ctx.fillStyle = "#ffffff";
        ctx.fillText(`${member.displayName}!`, canvas.width / 2.5, canvas.height  / 1.8);
        ctx.beginPath();
        ctx.arc(125, 125, 100, 0, Math.PI * 2, true);
        ctx.closePath();
        ctx.clip();

        //client.channels.cache.get(chat).send(member.user.displayAvatarURL({ format: 'png' }));
        const avatar = await Canvas.loadImage(member.user.displayAvatarURL({ format: 'png' }));
        ctx.drawImage(avatar, 25, 25, 200, 200);

        const attachment = new Discord.MessageAttachment(canvas.toBuffer(), "bem-vindo.png");
        client.channels.cache.get(chat).send(attachment);
    } 
});

client.on('guildMemberRemove', async member => {
    const guildExists = await welcomedb.findOne({ guildID: member.guild.id });
    if (guildExists) {
        const chat = guildExists.chatID;
        client.channels.cache.get(chat).send(`Adeus \`${member.user.username}\``);
    } 
});

client.on('message', async message => {
    let prefixDB;
    if (message.channel.type === 'text') {
        prefixDB = await prefixdb.findOne({ guildID: message.guild.id });
    }
    const prefix = prefixDB ? prefixDB.prefix : "db.";

    if (message.channel.type === 'text' && message.mentions.members.has(client.user.id) && !message.content.startsWith(prefix)) {
        return message.channel.send(`<a:lab_bloblegal:643912893246603314> Olá <@${message.author.id}> O meu prefixo neste servidor é \`${prefix}\`. Faz \`${prefix}help\` para veres o que posso fazer!`);
    }

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

    if (args >= command.args) {
        timestamps.set(message.author.id, now);
        setTimeout(() => timestamps.delete(message.author.id), cooldownAmount);
    }

    if (command.args && !args.length) {
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
});

client.login(process.env.TOKEN);