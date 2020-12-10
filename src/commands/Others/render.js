const { MessageEmbed, MessageAttachment } = require('discord.js');
const puppeteer = require('puppeteer');
const fs = require('fs');
const fetch = require('node-fetch');

module.exports = {
    name: 'render',
    description: 'Renderiza uma página web',
    aliases: ['webrender', 'renderizar'],
    category: 'Outros',
    usage: '<URL>',
    args: 1,
    cooldown: 10,
    guildOnly: true,
    async execute(client, message, args) {
        if (!message.channel.nsfw && message.author.id !== '334054158879686657') {
            /*const isPorn = await checkPorn();

            if (isPorn) {
                waitMsg.edit(`:x: <@${message.member.id}>, Não podes renderizar sites pornográficos!`);
                return browser.close();
            }*/
            return message.channel.send(':x: Só posso executar esse comando em canais NSFW.');
        }

        const waitMsg = await message.channel.send('<a:lab_loading:643912893011853332> A Verificar se o URL é válido...');
        let url;

        if (!args[0].startsWith('http'))
            url = 'http://' + args[0];
        else
            url = args[0];

        async function exists() {
            return new Promise(async (resolve, _reject) => {
                setTimeout(() => {
                    resolve(null);
                }, 5000)
                try {
                    const res = await fetch(url);

                    if (res)
                        resolve(res.url);
                    else
                        resolve(null);
                } catch (err) {
                    resolve(null);
                }
            })
        }

        /*async function checkPorn() {
            const res = await fetch(`https://fortiguard.com/search?q=${finalURL}&engine=1`);
            const text = await res.text();

            if (text.includes('Pornography')) 
                return true;
            else 
                return false;
        }*/

        const finalURL = await exists();

        if (!finalURL)
            return waitMsg.edit(`:x: <@${message.member.id}>, O site ${url} não existe ou não respondeu dentro de 5 segundos!`);

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
            await waitMsg.edit('<a:lab_loading:643912893011853332> A Renderizar a página...')
            await page.goto(url);
        } catch (err) {
            waitMsg.edit(':x: Site inválido!');
            return browser.close();
        }

        const img = await page.screenshot({ encoding: 'base64' });
        const attachment = new MessageAttachment(Buffer.from(img, 'base64'), 'render.png');

        const embed = new MessageEmbed()
            .setTitle(args[0])
            .setColor('RANDOM')
            .setURL(finalURL)
            .setImage(`attachment://render.png`)
            .setFooter(`${message.author.tag}`, message.author.displayAvatarURL({ dynamic: true }))
            .setTimestamp();

        waitMsg.delete();
        const msg = await message.channel.send({ embed, files: [attachment] });

        await browser.close();

        await msg.react('751062867444498432');

        const filter = (_r, u) => u.id === message.author.id || u.id === '334054158879686657' || message.guild.member(u).hasPermission('MANAGE_MESSAGES');
        const collector = msg.createReactionCollector(filter, { max: 1, time: 5 * 60 * 1000 });

        collector.on('collect', async r => {
            switch (r.emoji.name) {
                case 'x_':
                    await msg.delete();
                    message.channel.send('<a:lab_verificado:643912897218740224> Render fechada.');
                    break;
            }
        });

        collector.on('end', (_c, reason) => {
            if (reason === 'time') {
                msg.reactions.cache.map(reaction => {
                    reaction.users.remove(client.user.id);
                });
            }
        });
    }
}