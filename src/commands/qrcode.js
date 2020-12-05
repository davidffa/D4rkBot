const QRCode = require('qrcode');
const fetch = require('node-fetch');
const { MessageAttachment, MessageEmbed } = require('discord.js'); 

module.exports = {
    name: 'qrcode',
    description: 'Cria ou lê um código QR',
    aliases: ['qr'], 
    category: 'Outros',
    args: 1,
    usage: '<Criar/Ler> [Texto/URL]',
    cooldown: 3,
    async execute(_client, message, args, prefix) {
        switch(args[0].toLowerCase()) {
            case 'criar':
            case 'create':
            case 'c':
                if (args.slice(1).join(' ').length > 400)
                    return message.channel.send(':x: Só podes criar códigos QR com mensagens até 400 caracteres.');

                const url = await QRCode.toDataURL(args.slice(1).join(' '));
                const base64data = url.replace(/^data:image\/png;base64,/, '');

                const attachment = new MessageAttachment(Buffer.from(base64data, 'base64'), 'qr.png');

                const embed = new MessageEmbed()
                    .setTitle('<:qrcode:784833114761461800> QR Code')
                    .setColor('RANDOM')
                    .setImage('attachment://qr.png')
                    .setTimestamp()
                    .setFooter(message.author.tag, message.author.displayAvatarURL({ dynamic: true }));

                message.channel.send({ embed, files: [attachment] });
            break;

            case 'ler':
            case 'read':
            case 'r': 
            case 'l':
                const qrURL = args[1] || message.attachments.first().url;

                const data = await fetch(`http://api.qrserver.com/v1/read-qr-code/?fileurl=${qrURL}`).then(res => res.json()).then(json => json[0].symbol[0].data);

                if (!data) 
                    return message.channel.send(':x: Código QR inválido!');

                const embed2 = new MessageEmbed()
                    .setTitle('<:qrcode:784833114761461800> Leitor de QR Code')
                    .setColor('RANDOM')
                    .setDescription(`:newspaper: **Texto:**\n\n\`\`\`${data}\`\`\``)
                    .setThumbnail(qrURL)
                    .setTimestamp()
                    .setFooter(message.author.tag, message.author.displayAvatarURL({ dynamic: true }));

                message.channel.send(embed2);
            break;

            default:
                message.channel.send(`:x: **Use** ${prefix}qrcode <Criar/Ler>`);
            break;
        }
    }
}