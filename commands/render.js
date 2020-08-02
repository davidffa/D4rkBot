const { MessageEmbed, MessageAttachment } = require('discord.js');
const puppeteer = require('puppeteer');
const fs = require('fs');
const sightengine = require('sightengine')('1189037133', 'a5h33PCujWJRJbdBkRi2');

module.exports = {
    name: 'render',
    description: 'Renderiza uma página web',
    aliases: ['webrender'], 
    category: 'Outros',
    usage: '<URL>',
    cooldown: 3,
    guildOnly: true,
    async execute(client, message, args, prefix) {
        if (!args.length) 
            return message.channel.send(`:x: Argumentos em falta, **Usa:** ${prefix}render <URL>`);

        if (message.author.id != '334054158879686657')
            return;

        const name = 'screenshot' + Math.floor((Math.random() * 100) + 1);
        let url;

        if (!args[0].startsWith('http')) 
            url = 'http://' + args[0];
        else 
            url = args[0];

        if (!fs.existsSync('./screenshots')) 
            fs.mkdirSync()

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

        if (message.channel.nsfw) {
            const attachment = new MessageAttachment(`./screenshots/${name}.png`);
            
            const embed = new MessageEmbed()
            .setTitle(args[0])
            .setURL(url)
            .setImage(`attachment://${name}.png`)
            .setFooter(`${message.author.tag}`, message.author.displayAvatarURL())
            .setTimestamp();
    
            await message.channel.send({ embed, files: [attachment] });

            return fs.unlinkSync(`./screenshots/${name}.png`); 
        }

        sightengine.check(['nudity']).set_file(`./screenshots/${name}.png`).then(async result => {
            console.log(result)
            if (result.status !== 'success') 
                return message.channel.send(':x: Erro ao verificar a imagem!');
            
            if (result.nudity.raw > 0.01)  {
                fs.unlinkSync(`./screenshots/${name}.png`);  
                return message.channel.send(':x: Não podes renderizar conteúdo pornográfico!');
            }

            const attachment = new MessageAttachment(`./screenshots/${name}.png`);
            
            const embed = new MessageEmbed()
            .setTitle(args[0])
            .setURL(url)
            .setImage(`attachment://${name}.png`)
            .setFooter(`${message.author.tag}`, message.author.displayAvatarURL())
            .setTimestamp();
    
            await message.channel.send({ embed, files: [attachment] });

            fs.unlinkSync(`./screenshots/${name}.png`);  
        }).catch(function(err) {
            message.channel.send(':x: Erro ao verificar a imagem!');
            console.log(err);
        }); 
    }
}