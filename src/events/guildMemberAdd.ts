import Client from '../structures/Client';

import { Guild, Member } from 'eris';

import { resolve } from 'path';
import Canvas, { Canvas as CanvasOptions } from 'canvas';

export default class GuildMemberAdd {
    client: Client;

    constructor(client: Client) {
        this.client = client;
    }

    async run(guild: Guild, member: Member): Promise<void> {
        const guildData = member.guild.dbCache;

        if (!guildData) return;

        if (guildData.autoRole) member.addRole(guildData.autoRole, 'Autorole').catch(() => {});

        if (!guildData.welcomeChatID) return;

        const applyText = (canvas: CanvasOptions, text: string) => {
            const ctx = canvas.getContext('2d');
            let fontSize = 70;

            do {
                ctx.font = `${fontSize -= 10}px sans-serif`;
            }while (ctx.measureText(text).width > canvas.width - 300);

            return ctx.font;
        }

        const channel = guild.channels.get(guildData.welcomeChatID);

        if (!channel) {
            guildData.welcomeChatID = '';
            this.client.guildDB.updateOne({ guildID: guild.id }, { welcomeChatID: '' });
            return;
        }

        if (!channel.permissionsOf(this.client.user.id).has('sendMessages') || !channel.permissionsOf(this.client.user.id).has('attachFiles')) return;

        const canvas = Canvas.createCanvas(700, 250);
        const ctx = canvas.getContext('2d');

        const background = await Canvas.loadImage(String(resolve(__dirname, '..', 'assets', 'memberAddBackground.png')));
        
        ctx.drawImage(background, 0, 0, canvas.width, canvas.height);
        ctx.strokeRect(0, 0, canvas.width, canvas.height);

        ctx.font = "28px sans-serif";
        ctx.fillStyle = "#ffffff";
        ctx.fillText("Bem-Vindo, ", canvas.width / 2.5, canvas.height / 3.5);
        ctx.font = applyText(canvas, `${member.username}!`);
        ctx.fillStyle = "#ffffff";
        ctx.fillText(`${member.username}!`, canvas.width / 2.5, canvas.height  / 1.8);
        ctx.beginPath();
        ctx.arc(125, 125, 104, 0, Math.PI * 2, true);
        ctx.closePath();
        ctx.clip();

        const avatar = await Canvas.loadImage(member.user.staticAvatarURL);
        ctx.drawImage(avatar, 22, 22, 206, 206);

        this.client.createMessage(guildData.welcomeChatID, '', {
            name: 'bem-vindo.png',
            file: canvas.toBuffer()
        })
    }
}