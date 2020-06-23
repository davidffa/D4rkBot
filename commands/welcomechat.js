const welcomedb = require('../models/welcomedb');

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
        const guildExists = await welcomedb.findOne({ guildID: message.guild.id })
        if (!args.length) {
            if (guildExists) {
                message.channel.send(`Canal atual: <#${guildExists.chatID}>`)
            }
            message.channel.send(`**Use:** ${prefix}welcomechat <Nome do chat>\n (${prefix}welcomechat 0 - para desligar esta função) - Sete o canal para onde as mensagens de bem-vindo irão`)
            return
        } 
        if (args[0] === "0") {
            if (guildExists) {
                await welcomedb.deleteOne(guildExists)
                message.channel.send("<a:lab_verificado:643912897218740224> WelcomeChat desativado!")
            }
            return
        }

        const chat = message.mentions.channels.first()
            
        if (chat) {
            if (guildExists) {
                await welcomedb.updateOne({
                    guildID: message.guild.id,
                    chatID: chat.id,
                }).catch(console.log)
                message.channel.send(`<a:lab_verificado:643912897218740224> Chat de bem-vindo alterado para ${args[0]}.`)
            }else {
                await welcomedb.create({
                    guildID: message.guild.id,
                    chatID: chat.id,
                })
                message.channel.send(`<a:lab_verificado:643912897218740224> Chat de bem-vindo setado como ${args[0]}.`)
            }
        }else {
            message.guild.channels.map(async Chat => {
                if (Chat.name.toLowerCase() === args[0].toLowerCase()) {
                    if (guildExists) {
                        await welcomedb.updateOne({
                            guildID: message.guild.id,
                            chatID: Chat.id,
                        }).catch(console.log)
                        message.channel.send(`<a:lab_verificado:643912897218740224> Chat de bem-vindo alterado para ${Chat}.`)
                    }else {
                        await welcomedb.create({
                            guildID: message.guild.id,
                            chatID: Chat.id,
                        })
                        message.channel.send(`<a:lab_verificado:643912897218740224> Chat de bem-vindo setado como ${Chat}.`)
                    }
                }
            }) 
        }
    }
};