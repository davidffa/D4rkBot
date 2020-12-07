const { MessageEmbed } = require('discord.js');
const fetch = require('node-fetch');

module.exports = {
    name: 'isitup',
    description: 'Vê se um site está online', 
    category: 'Outros',
    usage: '<URL>',
    args: 1,
    cooldown: 4,
    async execute(client, message, args) {
        const HTTP = /^[a-zA-Z]+:\/\//
        const PATH = /(\/(.+)?)/g

        const url = args[0].replace(HTTP, '').replace(PATH, '');

        const body = await fetch(`https://isitup.org/${url}.json`).then(res => res.json()).catch(err => null);

        if (!body) {
            return message.channel.send(':x: Ocorreu um erro!');
        }

        if (body.response_code) {
            body.response_time *= 1000;
            const embed = new MessageEmbed()
                .setTitle('<:b_online2:585881537493467175> Está Online')
                .setColor('RANDOM')
                .setDescription(`O site **${args[0]}** com o IP **${body.response_ip}** respondeu com o HTTP Status Code **${body.response_code}** em **${body.response_time}ms**.`)
                .setTimestamp()
                .setFooter(message.author.tag, message.author.displayAvatarURL({ dynamic: true }));
            
            message.channel.send(embed);
        }else {
            const embed = new MessageEmbed()
                .setTitle('<:b_offline:438399398762905600> Está Offline')
                .setColor('RANDOM')
                .setDescription(`O site **${args[0]}** está offline.`)
                .setTimestamp()
                .setFooter(message.author.tag, message.author.displayAvatarURL({ dynamic: true }));
        
            message.channel.send(embed);
        }
    }
}