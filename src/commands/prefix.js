const guildDB = require('../models/guildDB');

module.exports = {
    name: 'prefix',
    description: 'Muda o meu prefixo neste servidor', 
    aliases: ["prefixo", "setprefix", "setarprefixo", "setprefixo"],
    usage: '<prefixo>',
    category: 'Definicoes',
    args: 1,
    guildOnly: true,
    cooldown: 5,
    async execute(client, message, args) {
        if (!message.member.hasPermission('MANAGE_GUILD') && message.author.id !== '334054158879686657')
            return message.channel.send(':x: Não tens permissão!');
        if (args[0].length > 5)
            return message.channel.send(':x: O meu prefixo não pode ultrapassar 5 caracteres.');

        const guild = await guildDB.findOne({ guildID: message.guild.id });

        if (guild) {
            await guildDB.updateOne({ guildID: message.guild.id }, {
                prefix: args[0].trim() 
            });
        }else {
            await guildDB.create({
                guildID: message.guild.id,
                prefix: args[0].trim(),
            });
        }
        return message.channel.send(`<a:lab_verificado:643912897218740224> Alteras-te o meu prefixo para ${args[0]}`);
    }
}