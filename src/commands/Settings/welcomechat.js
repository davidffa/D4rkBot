const guildDB = require('../../models/guildDB');

module.exports = {
    name: 'welcomechat',
    description: 'Seta o canal para onde as mensagens de bem-vindo irão',
    aliases: ["setchannel", "welcomechannel", "setwelcomechannel"],
    usage: '<#canal>',
    category: 'Definicoes',
    guildOnly: true,
    cooldown: 5,
    async execute(_client, message, args, prefix) {
        if (!message.member.hasPermission("MANAGE_MESSAGES") && message.author.id !== "334054158879686657")
            return message.channel.send(":x: Precisas da permissão `MANAGE_MESSAGES` para usar este comando!")

        const guild = message.guildDB;
        if (!args.length) {
            if (guild && guild.welcomeChatID) {
                message.channel.send(`Canal atual: <#${guild.welcomeChatID}>`)
            }
            return message.channel.send(`**Use:** ${prefix}welcomechat <Nome do chat>\n (${prefix}welcomechat 0 - para desligar esta função) - Sete o canal para onde as mensagens de bem-vindo irão`)
        }

        if (args[0] === '0') {
            if (guild) {
                guild.welcomeChatID = null;
                await guild.save();
                message.channel.send("<a:lab_verificado:643912897218740224> WelcomeChat desativado!")
            } else {
                message.channel.send(":x: O WelcomeChat não estava ativado!");
            }
            return
        }

        const textChannels = message.guild.channels.cache.filter(ch => ch.type === 'text');

        const chat = message.mentions.channels.filter(ch => ch.type === 'text').first()
            || textChannels.get(args[0]) || textChannels.filter(ch => ch.name.toLowerCase() === args[0].toLowerCase()).first();

        if (!chat) return message.channel.send(':x: Chat não encontrado!');

        if (guild) {
            const chatID = guild.welcomeChatID;
            guild.welcomeChatID = chat.id;
            await guild.save();

            if (chatID)
                message.channel.send(`<a:lab_verificado:643912897218740224> Chat de bem-vindo alterado para ${args[0]}.`)
            else
                message.channel.send(`<a:lab_verificado:643912897218740224> Chat de bem-vindo setado como ${args[0]}.`)
        } else {
            await guildDB.create({
                guildID: message.guild.id,
                welcomeChatID: chat.id
            });
            message.channel.send(`<a:lab_verificado:643912897218740224> Chat de bem-vindo setado como ${args[0]}.`)
        }
    }
};