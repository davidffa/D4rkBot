const { MessageEmbed } = require('discord.js');
const steam = require('steam-provider');
const provider = new steam.SteamProvider();

module.exports = {
    name: 'steam',
    description: 'Mostra informações sobre um jogo da steam',
    aliases: ['steamgame'], 
    category: 'Outros',
    usage: '<Jogo>',
    cooldown: 5,
    execute(client, message, args, prefix) {
        if (!args.length)
            return message.channel.send(`:x: Argumentos em falta! **Usa:** ${prefix}steam <Jogo>`);

        provider.search(args.join(' '), 1, 'portuguese', 'pt').then(result => {
            if (!result.length) {
                return message.channel.send(':x: Jogo não encontrado!');
            }
            provider.detail(result[0].id, 'portuguese', 'pt').then(results => {
                const embed = new MessageEmbed()
                    .setColor('RANDOM')
                    .setTitle('Loja Steam')
                    .setDescription(`**${results.name}**`)
                    .addField('ID', `\`${results.id}\``, true)
                    .addField('Genero', `\`${results.genres.join(', ')}\``, true)
                    .addField('Preço', `Preço normal: **${results.priceData.initialPrice}€**\n Preço de desconto: **${results.priceData.finalPrice}€**\n Desconto: **${results.priceData.discountPercent}%**`, true)
                    .addField('Plataformas', `\`${results.otherData.platforms.join(', ')}\``, true)
                    .addField('Tags', `\`${results.otherData.features.join(', ')}\``, true)
                    .addField('Pontuação', `\`${results.otherData.metacriticScore}\``, true)
                    .addField('Desenvolvedor(es)', `\`${results.otherData.developer.join(', ')}\``, true)
                    .addField('Publicador(es)', `\`${results.otherData.publisher.join(', ')}\``, true)
                    .setImage(results.otherData.imageUrl)
                    .setTimestamp()
                    .setFooter(message.author.tag, message.author.displayAvatarURL({ dynamic: true }));
                message.channel.send(embed);
            })
        })
    }
}