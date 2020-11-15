const guildDB = require('../models/guildDB');
const { MessageEmbed } = require('discord.js');

module.exports = {
    name: 'disable',
    description: 'Desativa um comando no servidor',
    aliases: ['disablecmd', 'disablecommand', 'desativar', 'desativarcmd', 'desativarcomando'],
    category: 'Definicoes',
    args: 1,
    guildOnly: true,
    usage: '<Comando>',
    cooldown: 3,
    async execute(client, message, args, prefix) {
        if (!message.member.hasPermission('MANAGE_GUILD') && message.author.id !== '334054158879686657')
            return message.channel.send(':x: Não tens permissão!');

        const command = client.commands.get(args[0].toLowerCase()) || client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(args[0].toLowerCase()));

        if (!command)
            return message.channel.send(`:x: Eu não tenho o comando \`${args[0]}\``);

        if (command.name === 'help') {
            return message.channel.send(':x: Não podes desativar o comando de ajuda!');
        }else if (['disable', 'enable', 'ping', 'botinfo', 'invite', 'eval', 'reload'].includes(command.name)) {
            return message.channel.send(`:x: Não podes desativar o comando \`${args[0]}\``);
        }

        const guild = await guildDB.findOne({ guildID: message.guild.id });

        if (guild) {
            const disabledCmds = guild.disabledCmds;

            if (disabledCmds && disabledCmds.includes(command.name))
                return message.channel.send(`:x: O comando \`${args[0]}\` já está desativado. Usa \`${prefix}enable ${args[0]}\` se quiseres voltar a ativar o comando!`);
            
            await guildDB.updateOne({ guildID: message.guild.id }, {
                disabledCmds: [...disabledCmds, command.name]
            });
            
            const embed = new MessageEmbed()
                        .setColor('RANDOM')
                        .setDescription(`<:off:764478504124416040> O comando \`${args[0]}\` foi desativado com sucesso!`)
                        .setTimestamp()
                        .setFooter(message.author.tag, message.author.displayAvatarURL({ dynamic: true }));

            return message.channel.send(embed);
        } else {
            await guildDB.create({
                guildID: message.guild.id,
                disabledCmds: [command.name]
            });
            
            const embed = new MessageEmbed()
                        .setColor('RANDOM')
                        .setDescription(`<:off:764478504124416040> O comando \`${args[0]}\` foi desativado com sucesso!`)
                        .setTimestamp()
                        .setFooter(message.author.tag, message.author.displayAvatarURL({ dynamic: true }));

            return message.channel.send(embed);
        }
    }
}