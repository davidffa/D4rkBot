const fetch = require('node-fetch');
const { MessageEmbed } = require('discord.js');
const moment = require('moment');
moment.locale('pt-PT');

module.exports = {
    name: 'github',
    description: 'Informações sobre algum perfil do github',
    category: 'Outros',
    args: 1,
    usage: '<Nome>',
    cooldown: 5,
    async execute(_client, message, args) {
        const res = await fetch(`https://api.github.com/users/${args[0]}`);

        if (res.status !== 200) return message.channel.send(':x: Perfil não encontrado!');

        const user = await res.json();

        const embed = new MessageEmbed()
            .setTitle(`<:github:784791056670654465> Perfil do ${user.login}`)
            .setColor('RANDOM')
            .addField(':bust_in_silhouette: Nome', user.name || user.login, true)
            .addField(':id: ID', user.id, true)
            .addField(':bookmark: Repositórios Públicos', user.public_repos, true)
            .addField('<:followers:784795303156908032> Seguidores', user.followers, true)
            .addField(':busts_in_silhouette: A seguir', user.following, true)
            .setThumbnail(`${user.avatar_url}${Math.floor(Math.random() * 10000)}`)
            .setURL(user.html_url)
            .setTimestamp()
            .setFooter(message.author.tag, message.author.displayAvatarURL({ dynamic: true }));

        user.email && embed.addField(':e_mail: Email', user.email, true);
        user.company && embed.addField(':classical_building: Empresa', user.company, true);
        user.twitter_username && embed.addField('<:twitter:785165170547753002> Twitter', `[@${user.twitter_username}](https://twitter.com/${user.twitter_username})`, true);
        user.location && embed.addField(':map: Localização', user.location, true);

        embed.addField(':calendar: Criado em', `${moment(user.created_at).format('L')} (${moment(user.created_at).startOf('day').fromNow()})`, true);
        embed.addField(':calendar: Atualizado em', `${moment(user.updated_at).format('L')} (${moment(user.updated_at).startOf('day').fromNow()})`, true);

        user.bio && embed.addField(':bookmark_tabs: Biografia', `\n\`\`\`${user.bio}\`\`\``);

        message.channel.send(embed);
    }
}