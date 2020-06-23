const prefixdb = require('../models/prefixdb');

module.exports = {
    name: 'prefix',
    description: 'Muda o meu prefixo neste servidor', 
    aliases: ["prefixo", "setprefix", "setarprefixo", "setprefixo"],
    usage: '<prefixo>',
    category: 'Definicoes',
    guildOnly: true,
    cooldown: 5,
    async execute(client, message, args, prefix) {
        if (!message.member.hasPermission('ADMINISTRATOR') && message.author.id !== '334054158879686657')
            return message.channel.send(':x: Não tens permissão!');
        if (!args.length) 
            return message.channel.send(`Argumentos em falta! **Usa:** ${prefix}prefix <prefixo>`);
        if (args[0].length > 5)
            return message.channel.send(':x: O meu prefixo não pode ultrapassar 4 caracteres.');

        const prefixExists = await prefixdb.findOne({ guildID: message.guild.id });

        if (prefixExists) {
            await prefixdb.updateOne({
                guildID: message.guild.id,
                prefix: args[0]
            });
        }else {
            await prefixdb.create({
                guildID: message.guild.id,
                prefix: args[0]
            });
        }
        return message.channel.send(`<a:lab_verificado:643912897218740224> Alteras-te o meu prefixo para ${args[0]}`);
    }
}