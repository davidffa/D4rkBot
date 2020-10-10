const guildDB = require('../models/guildDB');
const { MessageEmbed } = require('discord.js');

module.exports = {
    name: 'enable',
    description: 'Ativa um comando no servidor',
    aliases: ['enablecmd', 'enablecommand', 'ativar', 'ativarcmd', 'ativarcomando'],
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

        const guild = await guildDB.findOne({ guildID: message.guild.id });

        if (guild) {
            const disabledCmds = guild.disabledCmds;

            if (!disabledCmds || (disabledCmds && !disabledCmds.includes(command.name)))
                return message.channel.send(`:x: O comando \`${args[0]}\` já está ativado. Usa \`${prefix}disable ${args[0]}\` se quiseres desativar o comando!`);
            
            await guildDB.updateOne({ guildID: message.guild.id }, {
                disabledCmds: disabledCmds.filter(cmd => cmd !== command.name)
            });
            
            const embed = new MessageEmbed()
                        .setColor('RANDOM')
                        .setDescription(`<:on:764478511875751937> O comando \`${args[0]}\` foi ativado com sucesso!`)
                        .setTimestamp()
                        .setFooter(message.author.tag, message.author.displayAvatarURL({ dynamic: true }));

            return message.channel.send(embed);
        }
    }
}