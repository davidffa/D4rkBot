const { MessageEmbed, MessageAttachment } = require('discord.js');
const puppeteer = require('puppeteer');
const fs = require('fs');

module.exports = {
    name: 'render',
    description: 'Renderiza uma página web',
    aliases: ['webrender'], 
    category: 'Outros',
    usage: '<URL>',
    cooldown: 3,
    async execute(client, message, args, prefix) {
        if (!args.length) 
            return message.channel.send(`:x: Argumentos em falta, **Usa:** ${prefix}render <URL>`);

        if (message.author.id != '334054158879686657')
            return message.channel.send(':x: Em manutenção!');
        const name = 'screenshot' + Math.floor((Math.random() * 100) + 1);
        let url;

        if (!args[0].startsWith('http')) 
            url = 'http://' + args[0];
        else 
            url = args[0];

        if (!fs.existsSync('./screenshots')) 
            fs.mkdirSync('./screenshots')

        const browser = await puppeteer.launch({
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
            ]
        });
        const page = await browser.newPage();
    
        await page.setViewport({
            width: 1920,
            height: 1080,
            deviceScaleFactor: 1
        });
    
        try {
            await page.goto(url);
        }catch (err) {
            return message.channel.send(':x: Link inválido!');
        }
            
        await page.screenshot({ path: `./screenshots/${name}.png`});
        await browser.close();
    
        const attachment = new MessageAttachment(`./screenshots/${name}.png`);
            
        const embed = new MessageEmbed()
            .setTitle(args[0])
            .setURL(url)
            .setImage(`attachment://${name}.png`)
            .setFooter(`${message.author.tag}`, message.author.displayAvatarURL())
            .setTimestamp();
    
        await message.channel.send({ embed, files: [attachment] });
    
        fs.unlinkSync(`./screenshots/${name}.png`);    
    }
}