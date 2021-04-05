import Command from '../../structures/Command';
import Client from '../../structures/Client';

import { Message } from 'eris';

export default class Channelinfo extends Command {
    constructor(client: Client) {
        super(client, {
            name: 'channelinfo',
            description: 'Mostra informações sobre um canal de voz do servidor',
            category: 'Info',
            aliases: ['chinfo'],
            usage: '[ID do canal/Nome]',
            cooldown: 4
        });
    }

    async execute(message: Message, args: Array<string>): Promise<void> {
        if (message.channel.type !== 0 || !message.channel.permissionsOf(this.client.user.id).has('embedLinks')) {
            message.channel.createMessage(':x: Preciso da permissão `Anexar Links` para executar este comando.');
            return;
        }

        const channel = args.length ? (message.channel.guild.channels.get(args[0])
            || message.channel.guild.channels.find(ch => ch.name.includes(args.join(' ')))) : message.channel;

        if (!channel) {
            message.channel.createMessage(':x: Canal não encontrado!');
            return;
        }
        
        const channelTypes = {
            0: 'Texto',
            2: 'Voz',
            4: 'Categoria',
            5: 'Anúncios',
            6: 'Loja',
            13: 'Estágio'
        }

        const embed = new this.client.embed()
            .setTitle('Channel Info')
            .setColor('RANDOM')
            .addField(':id: ID', `\`${channel.id}\``, true)
            .addField(':newspaper: Nome', `\`${channel.name}\``, true)
            .addField(':diamond_shape_with_a_dot_inside: Tipo', `\`${channelTypes[channel.type]}\``, true)
            .addField(':underage: NSFW', `\`${channel.nsfw ? 'Sim' : 'Não'}\``, true)
            .addField(':trophy: Posição', `\`${channel.position}\``, true)
            .setFooter(`${message.author.username}#${message.author.discriminator}`, message.author.dynamicAvatarURL())
            .setTimestamp();

        if (channel.type === 2 || channel.type === 13) {
            const regions: any = {
                'brazil': ':flag_br: Brasil',
                'europe': ':flag_eu: Europa',
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
                'southafrica': ':flag_za: África do Sul',
            }
            embed.addField(':notes: Taxa de bits', `\`${channel.bitrate}\``, true);
            embed.addField(':map: Região', `\`${channel.rtcRegion ? regions[channel.rtcRegion] : 'Auto'}\``, true);
            embed.addField(':movie_camera: Vídeo', `\`${channel.videoQualityMode === 1 ? 'Auto' : '720p'}\``, true);
        }

        channel.parentID && embed.addField(':flag_white: Categoria', `\`${message.channel.guild.channels.get(channel.parentID)?.name}\``, true);

        if (channel.type === 0 || channel.type === 5) {
            embed.addField(':question: Tópico', `\`${channel.topic ? channel.topic : 'Nenhum'}\``, true);
        }
        message.channel.createMessage({ embed });
    }
}