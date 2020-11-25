const guildDB = require('../models/guildDB');

module.exports = {
    name: 'djrole',
    description: 'Avança para um tempo específico da música',
    aliases: ['dj', 'cargodj'],
    category: 'Musica',
    usage: '<Cargo>',
    guildOnly: true,
    cooldown: 5,
    async execute(_client, message, args, prefix) {
        if (!message.member.hasPermission('MANAGE_ROLES') && message.author.id !== '334054158879686657')
            return message.channel.send(':x: Precisas da permissão `MANAGE_ROLES` para usar este comando!');

        const guild = await guildDB.findOne({ guildID: message.guild.id });

        const djrole = message.guild.roles.cache.get(guild.djrole);

        if (!args.length) {
            if (!guild || !guild.djrole)
                return message.channel.send(`:x: Nenhum cargo de DJ setado. **Usa:** \`${prefix}djrole <Cargo> (0 para desativar)\`.`);

            return message.channel.send(`<a:Labfm:482171966833426432> Cargo de DJ atual: \`${djrole.name}\`\n**Usa:** \`${prefix}djrole <Cargo> (0 para desativar)\`.`);
        }

        if (args[0] === '0') {
            if (guild.djrole) {
                guild.djrole = null;
                await guild.save();
                return message.channel.send('<a:lab_verificado:643912897218740224> DJ role desativado.');
            }
            return message.channel.send(':x: O DJ role não estava ativado!');
        }

        const role = message.mentions.roles.first() ||
            message.guild.roles.cache.get(args[0]) ||
            message.guild.roles.cache.filter(role => role.name.toLowerCase() === args[0].toLowerCase()).first();

        if (!role)
            return message.channel.send(`:x: Cargo \`${args[0]}\` não encontrado.`);

        if (guild) {
            const roleID = guild.roleID;
            guild.djrole = role.id;
            await guild.save();

            if (roleID)
                message.channel.send(`<a:lab_verificado:643912897218740224> DJ role alterado para \`${role.name}\``);
            else
                message.channel.send(`<a:lab_verificado:643912897218740224> Cargo \`${role.name}\` setado como DJ role.`);
        } else {
            await guildDB.create({
                guildID: message.guild.id,
                roleID: role.id,
            });
            message.channel.send(`<a:lab_verificado:643912897218740224> Cargo \`${role.name}\` setado como DJ role.`)
        }

    }
}