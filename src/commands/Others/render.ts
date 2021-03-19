import Command from '../../structures/Command';
import Client from '../../structures/Client';
import { ReactionCollector } from '../../structures/Collector';

import { Emoji, User, Message } from 'eris';

import fetch from 'node-fetch';
import puppeteer from 'puppeteer';

export default class Render extends Command {
    constructor(client: Client) {
        super(client, {
            name: 'render',
            description: 'Renderiza uma página web',
            args: 1,
            usage: '<URL>',
            category: 'Others',
            aliases: ['webrender', 'renderizar'],
            cooldown: 10
        });
    }

    async execute(message: Message, args: Array<string>): Promise<void> {
        if (message.channel.type !== 0) return;

        if (!message.channel.nsfw && message.author.id !== '334054158879686657') {
            message.channel.createMessage(':x: Só podes usar este comando em um canal NSFW.');
            return;
        }

        if (!message.channel.permissionsOf(this.client.user.id).has('attachFiles')) {
            message.channel.createMessage(':x: Preciso da permissão `ATTACH_FILES` para executar este comando');
            return;
        }

        if (!message.channel.permissionsOf(this.client.user.id).has('embedLinks')) {
            message.channel.createMessage(':x: Preciso da permissão `EMBED_LINKS` para executar este comando');
            return;
        }

        const waitMsg = await message.channel.createMessage('<a:loading2:805088089319407667> A verificar se o URL é válido...');

        let url = args[0];

        if (!args[0].startsWith('http'))
            url = 'http://' + args[0];
        
        const exists = async (): Promise<string|null> => {
            return new Promise(async (resolve) => {
                setTimeout(() => {
                    resolve(null);
                }, 5e3);

                try { 
                    const res = await fetch(url);

                    if (res)
                        resolve(res.url);
                    else
                        resolve(null)
                }catch(err) {
                    resolve(null);
                }
            })
        }

        const finalURL = await exists();

        if (!finalURL) {
            waitMsg.edit(`:x: ${message.member?.mention}, esse site não existe ou não respondeu dentro de 5 segundos.`);
            return;
        }

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
            await waitMsg.edit('<a:loading2:805088089319407667> A renderizar a página...');
            await page.goto(finalURL);
        }catch (err) {
            waitMsg.edit(':x: Site inválido');
            browser.close();
            return;
        }

        const img = await page.screenshot({ encoding: 'base64' }) as string;

        const embed = new this.client.embed()
            .setColor('RANDOM')
            .setTitle('Render')
            .setURL(finalURL)
            .setImage('attachment://render.png')
            .setTimestamp()
            .setFooter(`${message.author.username}#${message.author.discriminator}`, message.author.dynamicAvatarURL());

        waitMsg.delete();
        browser.close();

        const msg = await message.channel.createMessage({ embed }, {
            name: 'render.png',
            file: Buffer.from(img, 'base64')
        });

        await msg.addReaction('x_:751062867444498432');

        const filter = (r: Emoji, user: User) => (r.id === '751062867444498432') && user === message.author;

        const collector = new ReactionCollector(this.client, msg, filter, { max: 1, time: 5 * 60 * 1000 });
                
        collector.on('collect', () => {
            msg.delete();
            message.channel.createMessage('<a:verificado:803678585008816198> Render fechada.');
        });

        collector.on('end', reason => {
            if (reason === 'Time')
                msg.removeReaction('x_:751062867444498432');
        });
    }
}