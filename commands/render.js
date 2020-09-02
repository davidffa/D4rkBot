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
                request({url: url, followRedirect: false}, (error, res, body) => {
                    if (res && res.statusCode >= 200 && res.statusCode < 400) {
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
            return message.reply(':x: Site inválido!');
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
            //Check if website is nsfw using webscraping with puppeteer
            /*await page.goto(`https://fortiguard.com/search?q=${finalURL}&engine=1`);

            const text = await page.$eval('section .iprep h2 a', el => el.textContent).catch(err => null);

            if (!text) {
                message.reply(':x: Site inválido!');
                return await browser.close();
            }else if (text === 'Pornography') {
                message.reply(':x: Não podes renderizar sites pornográficos!');
                return await browser.close();
            }*/

            if (await checkPorn()) {
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
            .setURL(url)
            .setImage(`attachment://${name}.png`)
            .setFooter(`${message.author.tag}`, message.author.displayAvatarURL({ dynamic: true }))
            .setTimestamp();
    
        await message.channel.send({ embed, files: [attachment] });
        
        await browser.close();
        fs.unlinkSync(`./screenshots/${name}.png`); 
    }
}