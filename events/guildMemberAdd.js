const Discord = require('discord.js');
const welcomedb = require("../models/welcomedb");
const roledb = require('../models/roledb');
const Canvas = require('canvas');
const path = require('path');

module.exports.run = async (client, member) => {
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
        
        const background = await Canvas.loadImage(String(path.resolve(__dirname, '..', 'assets', 'wallpaper.png')));
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

        const avatar = await Canvas.loadImage(member.user.displayAvatarURL({ format: 'png' }));
        ctx.drawImage(avatar, 25, 25, 200, 200);

        const attachment = new Discord.MessageAttachment(canvas.toBuffer(), "bem-vindo.png");
        client.channels.cache.get(chat).send(attachment);
    }
}