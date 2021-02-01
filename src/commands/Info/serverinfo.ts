import Command from '../../structures/Command';
import Client from '../../structures/Client';
import Embed from '../../structures/Embed';

import { Message } from 'eris';

import moment from 'moment';
moment.locale('pt');

class Serverinfo extends Command {
    constructor(client: Client) {
        super(client, {
            name: 'serverinfo',
            description: 'Informações sobre o servidor.',
            aliases: ['si', 'svinfo'],
            category: 'Info',
            cooldown: 5,
        });
    }

    execute(message: Message): void {
        if (message.channel.type !== 0) return;
        
        if(!message.channel.permissionsOf(this.client.user.id).has('embedLinks')) {
            message.channel.createMessage(':x: Preciso da permissão `EMBED_LINKS` para executar este comando');
            return;
        }

        const guild = message.channel.guild;

        const status = {
            online: 0,
            dnd: 0,
            idle: 0,
            offline: 0
        };

        guild.members.forEach(member => {   
            member.status ? ++status[member.status] : ++status.offline;
        });
        
        const bots = guild.members.filter(m => m.bot).length;

        const textChannels = guild.channels.filter(ch => ch.type === 0).length;
        const voiceChannels = guild.channels.filter(ch => ch.type === 2).length;
        const categories = guild.channels.filter(ch => ch.type === 4).length;
        const newsChannels = guild.channels.filter(ch => ch.type === 5).length;
        const storeChannels = guild.channels.filter(ch => ch.type === 6).length;

        const boostAmount = guild.premiumSubscriptionCount;
        const boostLevel = guild.premiumTier;

        const emojis = guild.emojis.length;
        const animatedEmojis = guild.emojis.filter(e => e.animated).length;
        const staticEmojis = emojis - animatedEmojis;

        const verificationLevels: any = {
            0: 'Nenhum',
            1: 'Baixo',
            2: 'Médio',
            3: 'Alta',
            4: 'Mais alta'
        }

        const regions: any = {
            'brazil': ':flag_br: Brasil',
            'europe': ':flag_eu: Europa',
            'eu_west': ':flag_eu: Europa',
            'hong-kong': ':flag_hk: Hong-Kong',
            'japan': ':flag_jp: Japão',
            'india': ':flag_in: Índia',
            'russia': ':flag_ru: Rússia',
            'singapore': ':flag_sg: Singapura',
            'sydney': ':flag_au: Sydney',
            'us-south': ':flag_us: Sul dos Estados Unidos',
            'us-east': ':flag_us: Este dos Estados Unidos',
            'us-central': ':flag_us: Centro dos Estados Unidos',
            'us-west': ':flag_us: Oeste dos Estados Unidos',
            'southafrica': ':flag_za: África do Sul'
        }

        const embed = new Embed()
            .setTitle(`:bookmark_tabs: Informações do servidor **${message.channel.guild.name}**`)
            .setColor('RANDOM')
            .addField(':id: ID', guild.id, true)
            .addField(':crown: Dono do servidor', `${this.client.users.get(guild.ownerID)?.username}#${this.client.users.get(guild.ownerID)?.discriminator}`, true)
            .addField(':map: Local', regions[guild.region] || guild.region, true)
            .addField(':police_officer: Nível de verificação', verificationLevels[guild.mfaLevel], true)
            .addField('<:badgebooster:803666384373809233> Boost', `Nível: ${boostLevel}\nQuantidade: ${boostAmount}`, true)
            .addField(':calendar: Criado em', `${moment(guild.createdAt).format('L')} (${moment(guild.createdAt).startOf('day').fromNow()})`, true)
            .addField(':calendar: Entrada em', `${moment(message.member?.joinedAt).format('L')} (${moment(message.member?.joinedAt).startOf('day').fromNow()})`, true)
            .addField(`:grinning: Emojis [${emojis}]`, `Estáticos: ${staticEmojis}\nAnimados: ${animatedEmojis}`, true)
            .addField(`<:followers:784795303156908032> Cargos:`, `${guild.roles.size}`, true)
            .addField(`:man: Membros [${guild.members.size}]`, `<:online:804049640437448714> Online: ${status.online}\n<:idle:804049737383673899> Ausente: ${status.idle}\n<:dnd:804049759328403486> Ocupado: ${status.dnd}\n<:offline:804049815713480715> Offline: ${status.offline}\n<:bot:804028762307821578> Bots: ${bots}`, true)
            .addField(`:white_small_square: Canais [${guild.channels.size}]`, `<:chat:804050576647913522> Texto: ${textChannels}\n:microphone2: Voz: ${voiceChannels}\n:loudspeaker: Anúncios: ${newsChannels}\n:shopping_bags: Loja: ${storeChannels}\n:diamond_shape_with_a_dot_inside: Categorias: ${categories}`, true)
            .setThumbnail(message.channel.guild.dynamicIconURL())
            .setImage(message.channel.guild.dynamicBannerURL())
            .setTimestamp()
            .setFooter(`${message.author.username}#${message.author.discriminator}`, message.author.dynamicAvatarURL());
            
        message.channel.createMessage({ embed });
    }
}

module.exports = Serverinfo;