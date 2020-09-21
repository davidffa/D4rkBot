module.exports = {
    name: 'ban',
    description: 'Bane alguém', 
    usage: '<@user> [razão]',
    category: 'Admin',
    guildOnly: true,
    cooldown: 3,
    execute(client, message, args, prefix) { 
        if (!message.member.hasPermission('BAN_MEMBERS')) return message.reply(':x: Não tens permissão para banir membros!');
        if (!message.guild.member(client.user.id).hasPermission('BAN_MEMBERS')) return message.channel.send(':x: Não tenho permissão para banir membros!');

        if (!args.length) return message.channel.send(`:x: Argumentos em falta! Usa: ${prefix}ban <@user> [motivo]`);

        const user = message.mentions.users.first();
        if (!user) return message.reply(':x: Utilizador inválido!');
        const member = message.guild.member(user);

        let reason = args[1];
        if (!reason) reason = '';

        if (member.id === client.user.id) return message.reply(':x: Não me consigo banir a mim próprio!')
        if (!member.bannable) return message.reply(`:x: Não tenho permissão para banir o \`${member.displayName}\`.`)

        member.ban(reason).then(() => message.channel.send(`<a:lab_verificado:643912897218740224> Banis-te o \`${member.displayName}\` por \`${reason}\`.`))
            .catch(err => {
                message.reply(`:x: Ocorreu um erro ao tentar banir o \`${member.displayName}\`.`)
            })
    }
};