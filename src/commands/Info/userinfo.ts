import Command from '../../structures/Command';
import Client from '../../structures/Client';

import { Message, User, Member, Constants } from 'eris';

import moment from 'moment';
moment.locale('pt');

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

    getStatus(status: string|undefined): string {
        if (!status) return 'offline';
        if (status === 'idle') return 'Ausente';
        else if (status === 'dnd') return 'Ocupado';
        return status;
    }

    getDevice(member: Member): string|null {
        if (!member.clientStatus) return null;

        const res: string[] = [];
        if (member.clientStatus.desktop !== 'offline') res.push(':computer:');
        if (member.clientStatus.mobile !== 'offline') res.push(':mobile_phone:');
        if (member.clientStatus.web !== 'offline') res.push(':globe_with_meridians:');

        return res.join(' - ');
    }

    async execute(message: Message, args: Array<string>): Promise<void> {
        if (message.channel.type !== 0) return;
        if (!message.channel.permissionsOf(this.client.user.id).has('embedLinks')) {
            message.channel.createMessage(':x: Preciso da permissão `EMBED_LINKS` para executar este comando');
            return;
        }

        let user: User;

        if (!args.length)
            user = message.author;
        else
            user = message.mentions[0] || await this.client.utils.findUser(args.join(' '), message.channel.guild);

        if (!user) {
            message.channel.createMessage(':x: Utilizador não encontrado.');
            return;
        }
        
        const member = message.channel.guild.members.get(user.id);

        const embed = new this.client.embed()
            .setTitle(`Informações de ${user.bot ? '<:bot:804028762307821578>' : ''}${(member && member.nick) || user.username}`)
            .setColor('RANDOM')
            .addField(':bookmark_tabs: Tag', `\`${user.username}#${user.discriminator}\``, true)
            .addField(':id: ID', `\`${user.id}\``, true)
            .addField(':calendar: Conta criada em', `\`${moment(user.createdAt).format('L')} (${moment(user.createdAt).startOf('day').fromNow()})\``, true)
            .setThumbnail(user.dynamicAvatarURL())
            .setTimestamp()
            .setFooter(`${message.author.username}#${message.author.discriminator}`, message.author.dynamicAvatarURL());

        if (member) {
            embed.addField(':calendar: Entrada no servidor', `\`${moment(member.joinedAt).format('L')} (${moment(member.joinedAt).startOf('day').fromNow()})\``, true)
                .addField(':shrug: Status', `\`${this.getStatus(member.status)}\``, true)
            
            const devices = this.getDevice(member);

            if (devices) {
                embed.addField('Dispositivos :technologist:', devices, true);
            }

            const pos = message.channel.guild.members.map(m => { return { id: m.id, joinedAt: m.joinedAt }}).sort((a, b) => a.joinedAt - b.joinedAt).findIndex(m => m.id === member.id) + 1;

            embed.addField(':trophy: Posição de entrada', `\`${pos}/${message.channel.guild.members.size}\``, true)
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
            VERIFIED_BOT_DEVELOPER: '<:dev_badge:803665036769230899>'  
        }

        const flags = user.publicFlags;

        if (flags) {
            const flagArray = Object.entries(Constants.UserFlags).filter(([,bit]) => (flags & bit) == bit).map(([field,]) => field);
    
            const userBadges = flagArray.map(f => BadgeEmojis[f]);

            if (member?.premiumSince) {
                userBadges.push('<:badgenitro:803666299556200478>')
                userBadges.push('<:badgebooster:803666384373809233>');
            }else {
                if (user.dynamicAvatarURL().split('?')[0].endsWith('.gif')) {
                    userBadges.push('<:badgenitro:803666299556200478>')
                }
            }

            if (userBadges) {
                embed.addField('Emblemas :medal:', userBadges.join(' '), true);
            }
        }
        
        message.channel.createMessage({ embed });
    }
}
