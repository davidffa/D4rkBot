const fetch = require('node-fetch');

module.exports = {
    name: 'docs',
    description: 'Procura algo na documentação do discord.js',
    aliases: ['djsdocs'], 
    category: 'Outros',
    args: 1,
    usage: '<Query>',
    cooldown: 3,
    async execute(_client, message, args) {
        try {
            const docs = await fetch(`https://djsdocs.sorta.moe/v2/embed?src=stable&q=${args[0]}`).then(res => res.json());

            if (!docs) 
                return message.channel.send(':x: Não encontrei nada nas docs.');
    
            message.channel.send({ embed: docs });
        }catch (err) { 
            message.channel.send(':x: Não encontrei nada nas docs.');
        }   
    }
}