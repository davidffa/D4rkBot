const { MessageEmbed } = require('discord.js');

module.exports = {
    name: 'chatclear',
    description: 'Limpa mensagens do servidor', 
    aliases: ['clear', 'limparchat', 'purge', 'cc'],
    usage: '<Número de mensagens>',
    category: 'Moderation',
    guildOnly: true,
    args: 1,
    cooldown: 5,
    execute(client, message, args, prefix) {
        if (!message.member.hasPermission('MANAGE_MESSAGES'))
            return message.channel.send(':x: Não tens permissão!');

        if (!message.guild.member(client.user.id).hasPermission('MANAGE_MESSAGES'))
            return message.channel.send(':x: Não tenho permissão para apagar mensagens!');

        if (!args.length)
            return message.channel.send(`**Usa:** ${prefix}chatclear <Nº de mensagens (entre 2 e 98)>`);
        
        const number = args[0];
        if (isNaN(number)) 
            return message.channel.send(':x: Número inválido!');
        if (args[0] < 2 || args[0] >= 99) 
            return message.channel.send(':x: Só consigo limpar entre 2 e 98 mensagens de cada vez!');
        
        const embed = new MessageEmbed()
            .setColor('RANDOM')
            .setTitle('Chat Clear')
            .setTimestamp()
            .setFooter(message.author.tag, message.author.displayAvatarURL({ dynamic: true }));

        message.channel.bulkDelete(parseInt(args[0])+1, { filterOld: true }).then(async msgs => {
            if (parseInt(args[0])+1 !== msgs.size) 
                embed.setDescription(`<a:lab_verificado:643912897218740224> Limpas \`${msgs.size}\` mensagens\n
                                      :warning: Não consigo apagar mais mensagens!`);
            else
                embed.setDescription(`<a:lab_verificado:643912897218740224> Limpas \`${msgs.size}\` mensagens`);
            const msg = await message.channel.send(embed);  

            setTimeout(() => {
                if (!msg.deleted) msg.delete();
            }, 7000)
        });
    }
}