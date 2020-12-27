module.exports = {
    name: 'kick',
    description: 'Kicka alguém', 
    usage: '<@user/ID> [motivo]',
    category: 'Moderation',
    guildOnly: true,
    cooldown: 3,
    execute(client, message, args, prefix) { 
        if (!message.member.hasPermission('KICK_MEMBERS')) return message.reply(':x: Não tens permissão para expulsar membros!');
        if (!message.guild.member(client.user.id).hasPermission('KICK_MEMBERS')) return message.channel.send(':x: Não tenho permissão para expulsar membros!');

        if (!args.length) return message.channel.send(`:x: Argumentos em falta! Usa: ${prefix}kick <@user/ID> [motivo]`);

        const member = message.mentions.members.first() || message.guild.members.cache.get(args[0]);

        if (!member) return message.channel.send(':x: Membro não encontrado!');

        let reason = args.slice(1).join(' ') || 'Sem motivo';
        if (!reason) reason = '';

        if (member.id === client.user.id) return message.reply(':x: Não me consigo expulsar a mim próprio!')
        if (!member.kickable) return message.reply(`:x: Não tenho permissão para expulsar o \`${member.displayName}\`.`);

        member.kick(reason).then(() => message.channel.send(`<a:lab_verificado:643912897218740224> Expulsas-te o \`${member.displayName}\` por \`${reason}\`.`))
            .catch(() => {
                message.reply(`:x: Ocorreu um erro ao tentar expulsar o \`${member.displayName}\`.`)
            })
    }
};