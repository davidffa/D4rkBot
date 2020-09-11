const guildDB = require('../models/guildDB');

module.exports = {
    name: 'autorole',
    description: 'Seta o cargo padrão de novos membros do servidor',
    usage: '<Nome do cargo>',
    category: 'Definicoes',
    guildOnly: true,
    cooldown: 5,
    async execute(client, message, args, prefix) {
        if (!message.member.hasPermission('MANAGE_ROLES') && message.author.id != '334054158879686657')
            return message.channel.send(':x: Não tens permissão!');
        const guild = await guildDB.findOne({ guildID: message.guild.id });
        if (!args.length) {
            if (guild && guild.roleID) {
                const role = message.guild.roles.cache.get(guild.roleID);
                if (role) message.channel.send(`Role default atual: \`${role.name}\``)
                else {
                    await guildDB.updateOne({
                        guildID: message.guild.id,
                        roleID: null,
                    });
                }
            }
            return message.channel.send(`**Use:** ${prefix}autorole <Nome do cargo> (${prefix}autorole 0 - para desligar esta função)`);
        }
        if (args[0] === '0') {
            if (guild && guild.roleID) {
                await guildDB.updateOne({
                    guildID: message.guild.id,
                    roleID: null,
                });
                message.channel.send('<a:lab_verificado:643912897218740224> Autorole desativado!');
            } else
                message.channel.send(':x: O Autorole não estava ativado!');
            return;
        }

        if (!message.guild.me.hasPermission('MANAGE_ROLES')) {
            message.channel.send(":warning: Não tenho permissão para alterar cargos de membros.");
        }

        const role = message.mentions.roles.first();

        if (role) {
            if (guild) {
                const roleID = guild.roleID;
                await guildDB.updateOne({
                    guildID: message.guild.id,
                    roleID: role.id,
                }).catch(console.log)
                if (roleID)
                    message.channel.send(`<a:lab_verificado:643912897218740224> Autorole alterado para \`${role.name}\``);
                else
                    message.channel.send(`<a:lab_verificado:643912897218740224> Cargo \`${role.name}\` setado como autorole.`);
            } else {
                await guildDB.create({
                    guildID: message.guild.id,
                    prefix: null,
                    roleID: role.id,
                    welcomeChatID: null
                });
                message.channel.send(`<a:lab_verificado:643912897218740224> Cargo \`${role.name}\` setado como autorole.`)
            }
        } else {
            const role = message.guild.roles.cache.filter(role => role.name.toLowerCase() === args[0].toLowerCase()).first();

            if (!role)
                return message.channel.send(`:x: Cargo \`${args[0]}\` não encontrado!`);
            if (guild) {
                const roleID = guild.roleID;
                await guildDB.updateOne({
                    guildID: message.guild.id,
                    roleID: role.id,
                }).catch(console.log)
                if (roleID)
                    message.channel.send(`<a:lab_verificado:643912897218740224> Autorole alterado para \`${role.name}\``);
                else
                    message.channel.send(`<a:lab_verificado:643912897218740224> Cargo \`${role.name}\` setado como autorole.`);
            } else {
                await guildDB.create({
                    guildID: message.guild.id,
                    prefix: null,
                    roleID: role.id,
                    welcomeChatID: null
                });
                message.channel.send(`<a:lab_verificado:643912897218740224> Cargo \`${role.name}\` setado como autorole.`)
            }
        }
    }
}