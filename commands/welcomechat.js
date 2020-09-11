const guildDB = require('../models/guildDB');

module.exports = {
    name: 'welcomechat',
    description: 'Seta o canal para onde as mensagens de bem-vindo irão',
    aliases: ["setchannel", "welcomechannel", "setwelcomechannel"],
    usage: '<#canal>',
    category: 'Definicoes',
    guildOnly: true,
    cooldown: 5,
    async execute(client, message, args, prefix) {
        if (!message.member.hasPermission("MANAGE_MESSAGES") && message.author.id !== "334054158879686657") return message.channel.send(":x: Não tens permissão!")
        const guild = await guildDB.findOne({ guildID: message.guild.id })
        if (!args.length) {
            if (guild && guild.welcomeChatID) {
                message.channel.send(`Canal atual: <#${guild.welcomeChatID}>`)
            }
            message.channel.send(`**Use:** ${prefix}welcomechat <Nome do chat>\n (${prefix}welcomechat 0 - para desligar esta função) - Sete o canal para onde as mensagens de bem-vindo irão`)
            return
        }
        if (args[0] === '0') {
            if (guild) {
                await guildDB.updateOne({
                    guildID: message.guild.id,
                    welcomeChatID: null,
                }).catch(console.log)
                message.channel.send("<a:lab_verificado:643912897218740224> WelcomeChat desativado!")
            } else {
                message.channel.send(":x: O WelcomeChat não estava ativado!");
            }
            return
        }

        const chat = message.mentions.channels.first()

        if (chat) {
            if (guild) {
                const chatID = guild.welcomeChatID;
                await guildDB.updateOne({
                    guildID: message.guild.id,
                    welcomeChatID: chat.id,
                }).catch(console.log)
                if (chatID)
                    message.channel.send(`<a:lab_verificado:643912897218740224> Chat de bem-vindo alterado para ${args[0]}.`)
                else
                    message.channel.send(`<a:lab_verificado:643912897218740224> Chat de bem-vindo setado como ${args[0]}.`)
            } else {
                await guildDB.create({
                    guildID: message.guild.id,
                    prefix: null,
                    roleID: null,
                    welcomeChatID: chat.id
                });
                message.channel.send(`<a:lab_verificado:643912897218740224> Chat de bem-vindo setado como ${args[0]}.`)
            }
        } else {
            const chat = message.guild.channels.cache.filter(channel => channel.type === 'text' && channel.name.toLowerCase() === args[0].toLowerCase()).first();

            if (!chat)
                return message.channel.send(':x: Chat não encontrado!');

            if (guild) {
                const chatID = guild.welcomeChatID;
                await guildDB.updateOne({
                    guildID: message.guild.id,
                    welcomeChatID: chat.id
                }).catch(console.log)
                if (chatID)
                    message.channel.send(`<a:lab_verificado:643912897218740224> Chat de bem-vindo alterado para ${args[0]}.`)
                else
                    message.channel.send(`<a:lab_verificado:643912897218740224> Chat de bem-vindo setado como ${args[0]}.`)
            } else {
                await guildDB.create({
                    guildID: message.guild.id,
                    prefix: null,
                    roleID: null,
                    welcomeChatID: chat.id
                });
                message.channel.send(`<a:lab_verificado:643912897218740224> Chat de bem-vindo setado como ${args[0]}.`)
            }
        }
    }
};