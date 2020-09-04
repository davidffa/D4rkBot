const { MessageEmbed, MessageAttachment } = require('discord.js');
const puppeteer = require('puppeteer');
const fs = require('fs');
const request = require('request');

module.exports = {
    name: 'render',
    description: 'Renderiza uma página web',
    aliases: ['webrender'], 
    category: 'Outros',
    usage: '<URL>',
    args: 1,
    cooldown: 10,
    guildOnly: true,
    async execute(client, message, args, prefix) {
        const name = 'screenshot' + Math.floor((Math.random() * 100) + 1);
        let url;

        if (!args[0].startsWith('http')) 
            url = 'http://' + args[0];
        else 
            url = args[0];

        async function exists() {
            return new Promise((resolve, reject) => {
                request({ url: url, followRedirect: false, timeout: 3000 }, (error, res, body) => {
                    if (res && res.statusCode) {
                        resolve(res.headers.location);
                    }else {
                        resolve(null);
                    }
                });
            });
        }

        async function checkPorn() {
            return new Promise((resolve, reject) => {
                request({ url: `https://fortiguard.com/search?q=${finalURL}&engine=1`}, (err, res, body) => {
                    if (body.includes('Pornography')) 
                        resolve(true);
                    else 
                        resolve(false);
                });
            });
        }

        finalURL = await exists();

        if (finalURL === null)
            return message.reply(`:x: O site ${url} não existe ou não respondeu dentro de 3 segundos!`);
        else if (finalURL === undefined)
            finalURL = url;

        if (!fs.existsSync('./screenshots')) 
            fs.mkdirSync('./screenshots');

        const browser = await puppeteer.launch({
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
            ]
        });

        const page = await browser.newPage();

        if (!message.channel.nsfw) {
            const isPorn = await checkPorn();

            if (isPorn) {
                message.reply(':x: Não podes renderizar sites pornográficos!');
                return browser.close();
            }
        }
    
        await page.setViewport({
            width: 1920,
            height: 1080,
            deviceScaleFactor: 1
        });
    
        try {
            await page.goto(url);
        }catch (err) {
            message.channel.send(':x: Link inválido!');
            return browser.close();
        }
            
        await page.screenshot({ path: `./screenshots/${name}.png`});

        const attachment = new MessageAttachment(`./screenshots/${name}.png`);
            
        const embed = new MessageEmbed()
            .setTitle(args[0])
            .setColor('RANDOM')
            .setURL(url)
            .setImage(`attachment://${name}.png`)
            .setFooter(`${message.author.tag}`, message.author.displayAvatarURL({ dynamic: true }))
            .setTimestamp();
    
        const msg = await message.channel.send({ embed, files: [attachment] });
        
        await browser.close();
        fs.unlinkSync(`./screenshots/${name}.png`); 
        
        await msg.react('751062867444498432');

        const filter = (r, u) => r.me && (u.id === message.author.id || u.id === '334054158879686657' || message.guild.member(u).hasPermission('MANAGE_MESSAGES'));
        const collector = msg.createReactionCollector(filter, { max: 1, time: 60 * 1000 });

        collector.on('collect', async r => {
            switch(r.emoji.name) {
                case 'x_':
                    await msg.delete();
                    message.channel.send('<a:lab_verificado:643912897218740224> Render fechada.');  
                    break;
            }
        });
    }
}