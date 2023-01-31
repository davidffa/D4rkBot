import Command from '../../structures/Command';
import Client from '../../structures/Client';
import CommandContext from '../../structures/CommandContext';

import { User, Member, Constants } from 'oceanic.js';
import { dynamicAvatar } from '../../utils/dynamicAvatar';

export default class Userinfo extends Command {
  constructor(client: Client) {
    super(client, {
      name: 'userinfo',
      description: 'Informações sobre alguém.',
      category: 'Info',
      aliases: ['ui', 'usrinfo'],
      cooldown: 5,
      usage: '[nome]'
    });
  }

  getStatus(status: string | undefined): string {
    if (!status) return 'offline';
    if (status === 'idle') return 'Ausente';
    else if (status === 'dnd') return 'Ocupado';
    return status;
  }

  getDevice(member: Member): string | null {
    if (!member.presence) return null;

    const res: string[] = [];
    if (member.presence.clientStatus.desktop !== 'offline') res.push(':computer:');
    if (member.presence.clientStatus.mobile !== 'offline') res.push(':mobile_phone:');
    if (member.presence.clientStatus.web !== 'offline') res.push(':globe_with_meridians:');

    return res.join(' - ');
  }

  async execute(ctx: CommandContext): Promise<void> {
    if (ctx.channel.type !== 0 || !ctx.guild) return;
    if (!ctx.channel.permissionsOf(this.client.user.id).has('EMBED_LINKS')) {
      ctx.sendMessage({ content: ':x: Preciso da permissão `Anexar Links` para executar este comando', flags: 1 << 6 });
      return;
    }

    let user: User | null;

    if (!ctx.args.length)
      user = ctx.targetUsers?.[0] ?? ctx.author;
    else
      user = ctx.targetUsers?.[0] ?? await this.client.utils.findUser(ctx.args.join(' '), ctx.guild);

    if (!user) {
      ctx.sendMessage({ content: ':x: Utilizador não encontrado.', flags: 1 << 6 });
      return;
    }

    const member = ctx.guild.members.get(user.id);

    const embed = new this.client.embed()
      .setTitle(`Informações de ${user.bot ? '<:bot:804028762307821578>' : ''}${(member && member.nick) || user.username}`)
      .setColor('RANDOM')
      .addField(':bookmark_tabs: Tag', `\`${user.username}#${user.discriminator}\``, true)
      .addField(':id: ID', `\`${user.id}\``, true)
      .addField(':calendar: Conta criada em', `<t:${Math.floor(user.createdAt.getDate() / 1e3)}:d> (<t:${Math.floor(user.createdAt.getDate() / 1e3)}:R>)`, true)
      .setThumbnail(dynamicAvatar(user))
      .setTimestamp()
      .setFooter(`${ctx.author.username}#${ctx.author.discriminator}`, dynamicAvatar(ctx.author));

    if (member) {
      embed.addField(':calendar: Entrada no servidor', `<t:${Math.floor(member.joinedAt!.getDate() / 1e3)}:d> (<t:${Math.floor(member.joinedAt!.getDate() / 1e3)}:R>)`, true)
        .addField(':shrug: Status', `\`${this.getStatus(member.presence!.status)}\``, true)

      const devices = this.getDevice(member);

      if (devices) {
        embed.addField('Dispositivos :technologist:', devices, true);
      }

      const pos = ctx.guild.members.map(m => { return { id: m.id, joinedAt: m.joinedAt } }).sort((a, b) => a.joinedAt?.getDate()! - b.joinedAt?.getDate()!).findIndex(m => m.id === member.id) + 1;

      embed.addField(':trophy: Posição de entrada', `\`${pos}/${ctx.guild.members.size}\``, true)
    }

    const BadgeEmojis: any = {
      DISCORD_EMPLOYEE: '<:staffbadge:803667272186462258>',
      PARTNERED_SERVER_OWNER: '<:partnerbadge:803667091429130260>',
      HYPESQUAD_EVENTS: '<:badgehypesquadevents:803665575703478323>',
      BUG_HUNTER_LEVEL_1: '<:badgebughunter:803664937016360991>',
      HOUSE_BRAVERY: '<:badgehypebravery:803665178720731137>',
      HOUSE_BRILLIANCE: '<:badgehypebrilliance:803665185558102017>',
      HOUSE_BALANCE: '<:badgehypebalance:803665192310800395>',
      EARLY_SUPPORTER: '<:badgeearlysupporter:803665859406725121>',
      TEAM_USER: '',
      SYSTEM: '',
      BUG_HUNTER_LEVEL_2: '<:BugHunterLvl2:803665318274400256>',
      VERIFIED_BOT: '<:vBot1:804393321862397952><:vBot2:804393321854140440>',
      VERIFIED_BOT_DEVELOPER: '<:dev_badge:803665036769230899>',
      DISCORD_CERTIFIED_MODERATOR: '<:DiscordCertifiedModerator:863424954371932180>',
      BOT_HTTP_INTERACTIONS: '', // idk
    }

    const flags = (user.publicFlags ?? 0) & ~(Constants.UserFlags.BOT_HTTP_INTERACTIONS);

    if (flags) {
      const flagArray = Object.entries(Constants.UserFlags).filter(([, bit]) => typeof bit === 'number' && (flags & bit) == bit).map(([field,]) => field);

      const userBadges = flagArray.map(f => BadgeEmojis[f]);

      if (member?.premiumSince) {
        userBadges.push('<:badgenitro:803666299556200478>')
        userBadges.push('<:badgebooster:803666384373809233>');
      } else if (user.avatar && user.avatar.startsWith('a_')) {
        userBadges.push('<:badgenitro:803666299556200478>')
      }

      if (userBadges) {
        embed.addField('Emblemas :medal:', userBadges.join(' '), true);
      }
    }

    ctx.sendMessage({ embeds: [embed] });
  }
}
