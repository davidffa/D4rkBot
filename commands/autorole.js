const roledb = require('../models/roledb');

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
        const guildExists = await roledb.findOne({ guildID: message.guild.id });
        if (!args.length) {
            if (guildExists) {
                const role = message.guild.roles.cache.get(guildExists.roleID);
                message.channel.send(`Role default atual: \`${role.name}\``)
            }
            message.channel.send(`**Use:** ${prefix}autorole <Nome do cargo> (${prefix}autorole 0 - para desligar esta função)`);
        }
        if (args[0] == '0') {
            if (guildExists) {
                await roledb.deleteOne(guildExists);
                message.channel.send('<a:lab_verificado:643912897218740224> Autorole desativado!');
            }
        }

        const role = message.mentions.roles.first();

        if (role) {
            message.channel.send(`<a:lab_verificado:643912897218740224> Cargo ${role.name} setado como cargo padrão para novos membros do servidor!`);
            if (guildExists) {
                await roledb.updateOne({
                    guildID: message.guild.id,
                    roleID: role.id,
                }).catch(console.log)
                message.channel.send(`<a:lab_verificado:643912897218740224> Autorole alterado para \`${role.name}\``);
            }else {
                await roledb.create({
                    guildID: message.guild.id,
                    roleID: role.id,
                });
                message.channel.send(`<a:lab_verificado:643912897218740224> Cargo \`${role.name}\` setado como autorole.`)
            }
        }else {
            let findRole = false;
            if (message.guild.roles.cache.length) 
                return message.channel.send(`:x: Cargo \`${args[0]}\` não encontrado!`);
            message.guild.roles.cache.map(async role => {
                if (role.name.toLowerCase() === args[0].toLowerCase()) {
                    findRole = true;
                    if (guildExists) {
                        await roledb.updateOne({
                            guildID: message.guild.id,
                            roleID: role.id,
                        }).catch(console.log)
                        return message.channel.send(`<a:lab_verificado:643912897218740224> Autorole alterado para \`${role.name}\``);
                    }else {
                        await roledb.create({
                            guildID: message.guild.id,
                            roleID: role.id,
                        });
                        return message.channel.send(`<a:lab_verificado:643912897218740224> Cargo \`${role.name}\` setado como autorole.`)
                    }
                }
            });
            if (!findRole) return message.channel.send(`:x: Cargo \`${args[0]}\` não encontrado!`);
        }
    }
}