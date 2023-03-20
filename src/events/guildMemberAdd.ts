import Client from '../structures/Client';

import { Member, TextableChannel } from 'oceanic.js';

import { resolve } from 'path';
import Canvas, { Canvas as CanvasOptions } from 'canvas';

export default class GuildMemberAdd {
  client: Client;

  constructor(client: Client) {
    this.client = client;
  }

  async run(member: Member): Promise<void> {
    const { guild } = member;
    const guildData = this.client.guildCache.get(guild.id);

    if (!guildData) return;

    let botHighestRole = guild.roles.get(guild.id);
    const targetRole = guild.roles.get(guildData.autoRole);

    guild.members.get(this.client.user.id)?.roles.forEach(roleID => {
      const role = guild.roles.get(roleID);
      if (!role) return;
      if (!botHighestRole || role.position > botHighestRole.position) {
        botHighestRole = role;
      }
    });

    if (botHighestRole && targetRole && botHighestRole.position > targetRole.position) {
      if (guildData.autoRole) member.addRole(guildData.autoRole, 'Autorole').catch(() => { });
    }

    if (!guildData.welcomeChatID) return;
    if ((guild.members.get(this.client.user.id)!.communicationDisabledUntil?.getTime() ?? 0) > Date.now()) return;

    const applyText = (canvas: CanvasOptions, text: string) => {
      const ctx = canvas.getContext('2d');
      let fontSize = 70;

      do {
        ctx.font = `${fontSize -= 10}px sans-serif`;
      } while (ctx.measureText(text).width > canvas.width - 300);

      return ctx.font;
    }

    const channel = guild.channels.get(guildData.welcomeChatID);

    if (!channel) {
      guildData.welcomeChatID = '';
      this.client.guildDB.updateOne({ guildID: guild.id }, { welcomeChatID: '' });
      return;
    }

    if (!channel.permissionsOf(this.client.user.id).has('SEND_MESSAGES') || !channel.permissionsOf(this.client.user.id).has('ATTACH_FILES')) return;

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
    ctx.fillText(`${member.username}!`, canvas.width / 2.5, canvas.height / 1.8);
    ctx.beginPath();
    ctx.arc(125, 125, 104, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.clip();

    const avatar = await Canvas.loadImage(member.user.avatarURL());
    ctx.drawImage(avatar, 22, 22, 206, 206);

    const ch = guild.channels.get(guildData.welcomeChatID) as TextableChannel;

    ch.createMessage({
      files: [{
        name: 'bem-vindo.png',
        contents: canvas.toBuffer()
      }]
    })
  }
}