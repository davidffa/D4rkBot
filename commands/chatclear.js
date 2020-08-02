const { MessageEmbed } = require('discord.js');

module.exports = {
    name: 'chatclear',
    description: 'Limpa mensagens do servidor', 
    aliases: ['clear', 'limparchat', 'purge', 'cc'],
    usage: '<Número de mensagens>',
    category: 'Admin',
    guildOnly: true,
    args: 1,
    cooldown: 5,
    execute(client, message, args, prefix) {
        if (!message.member.hasPermission('MANAGE_MESSAGES'))
            return message.channel.send(':x: Não tens permissão!');

        if (!message.guild.member(client.user.id).hasPermission('MANAGE_MESSAGES'))
            return message.channel.send(':x: Não tenho permissão para apagar mensagens!');

        if (!args.length)
            return message.channel.send(`**Usa:** ${prefix}chatclear <Nº de mensagens (entre 2 e 99)>`);
        
        const number = args[0];
        if (isNaN(number)) 
            return message.channel.send(':x: Número inválido!');
        if (args[0] < 2 || args[0] >= 100) 
            return message.channel.send(':x: Só consigo limpar entre 2 e 99 mensagens de cada vez!');
        
        const embed = new MessageEmbed()
            .setColor('RANDOM')
            .setTitle('Chat Clear')
            .setTimestamp()
            .setFooter(message.author.tag, message.author.displayAvatarURL());

        message.channel.bulkDelete(parseInt(args[0]), { filterOld: true }).then(msgs => {
            if (parseInt(args[0]) !== msgs.size) 
                embed.setDescription(`<a:lab_verificado:643912897218740224> Limpas \`${msgs.size}\` mensagens\n
                                      :x: Não consigo apagar mais mensagens! Só consigo apagar mensagens com data de envio menor que 2 semanas.`);
            else
                embed.setDescription(`<a:lab_verificado:643912897218740224> Limpas \`${msgs.size}\` mensagens`);
            message.channel.send(embed);  
        });
    }
}