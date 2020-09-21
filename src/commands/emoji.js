const { MessageEmbed } = require('discord.js');
const moment = require('moment');
moment.locale('pt-PT');

module.exports = {
    name: 'emoji',
    description: 'Informações sobre emojis do servidor',
    aliases: ['emojis'], 
    category: 'Outros',
    guildOnly: true,
    usage: '[Nome]',
    cooldown: 6,
    async execute(client, message, args, prefix) {
        if (message.guild.emojis.cache.size === 0)
                return message.channel.send(':x: Este servidor não tem emojis!');

        if (!args.length) {
            const emojiArr = message.guild.emojis.cache.array();
            let page = 1;
            
            function getEmojiMessage() {
                let eMsg = '';

                for (let pos = (page-1)*10; pos < (page-1)*10+10; pos++) {
                    if (!emojiArr[pos].animated) 
                        eMsg += '<:';
                    else
                        eMsg += '<';
                    eMsg += `${emojiArr[pos].identifier}>`;

                    if (!emojiArr[pos+1]) break;

                    if (pos != (page-1)*10+10-1) eMsg += ' | ';
                }

                return eMsg;
            }

            async function reactMessage() {
                await msg.react('⏪');
                await msg.react('⏩');
            }

            async function createCollector() {
                const filter = (r, u) => r.me && u.id === message.author.id;
                const collector = await msg.createReactionCollector(filter, { time: 60 * 1000 });

                collector.on('collect', async r => {
                    switch(r.emoji.name) {
                        case '⏪':
                            if (page != 1) {
                                page--;
                                const embed = new MessageEmbed()
                                    .setTitle(':grinning: Emojis do servidor')
                                    .setColor('RANDOM')
                                    .setDescription(getEmojiMessage())
                                    .setFooter(`Página ${page} de ${Math.ceil(emojiArr.length/10)}`)
                                await msg.edit(embed);
                            }
                            break;
                        case '⏩':
                            if (page != Math.ceil(emojiArr.length/10)) {
                                page++;
                                const embed = new MessageEmbed()
                                    .setTitle(':grinning: Emojis do servidor')
                                    .setColor('RANDOM')
                                    .setDescription(getEmojiMessage())
                                    .setFooter(`Página ${page} de ${Math.ceil(emojiArr.length/10)}`)
                                await msg.edit(embed);
                            }
                            break;
                    }              
                });
            }

            const embed = new MessageEmbed()
                .setTitle(':grinning: Emojis do servidor')
                .setColor('RANDOM')
                .setDescription(getEmojiMessage())
                .setFooter(`Página ${page} de ${Math.ceil(emojiArr.length/10)}`)
            
            const msg = await message.channel.send(embed);
            
            await createCollector();
            await reactMessage();
        }else {
            const emojiName = args[0].toLowerCase();
            const emojiArr = [];
            
            async function getEmojiById() {
                let emojiID = args[0];
                if (isNaN(args[0])) {
                    let array = args[0].split(':')[2].split('');
                    array.pop();
                    emojiID = array.join('');
                }
                const emoji = message.guild.emojis.cache.get(emojiID);

                if (emoji) {
                    const embed = new MessageEmbed()
                        .setTitle('Emoji Info')
                        .setColor('RANDOM')
                        .addField('Animado:', `\`${emoji.animated ? 'Sim' : 'Não'}\``, true)
                        .addField('Criado em:', `\`${moment(emoji.createdAt).format('L')}\``, true)
                        .addField('ID:', `\`${emoji.id}\``, true)
                        .addField('Nome:', `\`${emoji.name}\``, true)
                        .addField('Servidor:', `\`${emoji.guild.name}\``, true)
                        .addField('Identificador:', `\`${emoji.animated ? '<' + emoji.identifier + '>' : '<:' + emoji.identifier + '>'}\``, true)
                        .setThumbnail(emoji.url)
                        .setTimestamp()
                        .setFooter(message.author.tag, message.author.displayAvatarURL({ dynamic: true }))
                    return message.channel.send(embed);
                }
            }

            try {
                let emojiID = args[0];
                if (isNaN(args[0])) {
                    let array = args[0].split(':')[2].split('');
                    array.pop();
                    emojiID = array.join('');
                }
                const emoji = message.guild.emojis.cache.get(emojiID);
                if (emoji)
                    return await getEmojiById(emoji.id); 
            }catch(err) {}

            async function reactMessage() {
                try {
                    for (let pos=0; pos < 10 && emojiArr[pos]; pos++) {
                        await msg.react(emojiArr[pos].identifier);
                    }
                }catch(err) {}
            }

            async function createCollector() {
                const filter = (r, u) => r.me && u.id === message.author.id;
                const collector = await msg.createReactionCollector(filter, { time: 30 * 1000 });

                collector.on('collect', async r => {
                    args[0] = r.emoji.id;
                    await msg.delete();
                    await getEmojiById();            
                });
            }

            function getEmojiMessage2() {
                let eMsg = '';

                for (let pos = 0; pos < 10; pos++) {
                    if (!emojiArr[pos].animated) 
                        eMsg += '<:';
                    else
                        eMsg += '<';
                    eMsg += `${emojiArr[pos].identifier}>`;

                    if (!emojiArr[pos+1]) break;

                    if (pos != 19) eMsg += ' | ';
                }

                return eMsg;
            }

            await message.guild.emojis.cache.map(emoji => {
                if (emoji.name.toLowerCase().startsWith(emojiName) || emoji.name.toLowerCase().includes(emojiName) || emoji.name.toLowerCase().endsWith(emojiName)) {
                    emojiArr.push(emoji);
                }
            });

            if (!emojiArr.length)
                return message.channel.send(':x: Emoji não encontrado!');

            const embed = new MessageEmbed()
                .setTitle(':grinning: Emojis do servidor')
                .setColor('RANDOM')
                .setDescription('Clique num emoji para obter informações sobre ele\n\n' + getEmojiMessage2())
                .setTimestamp()
                .setFooter(message.author.tag, message.author.displayAvatarURL({ dynamic: true }))
            
            const msg = await message.channel.send(embed);
            
            await createCollector();
            await reactMessage();
        }
    }
}