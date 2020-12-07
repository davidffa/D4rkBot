module.exports = {
    name: 'ban',
    description: 'Bane alguém', 
    usage: '<@user> [razão]',
    category: 'Moderation',
    args: 1,
    guildOnly: true,
    cooldown: 3,
    execute(client, message, args) { 
        if (!message.member.hasPermission('BAN_MEMBERS')) return message.reply(':x: Não tens permissão para banir membros!');
        if (!message.guild.member(client.user.id).hasPermission('BAN_MEMBERS')) return message.channel.send(':x: Não tenho permissão para banir membros!');

        const user = message.mentions.users.first() || message.guild.members.cache.get(args[0]);
        if (!user) return message.reply(':x: Utilizador inválido!');
        const member = message.guild.member(user);

        const reason = args.slice(1).join(' ') || 'Sem motivo';

        if (member.id === client.user.id) return message.reply(':x: Não me consigo banir a mim próprio!')
        if (!member.bannable) return message.reply(`:x: Não tenho permissão para banir o \`${member.displayName}\`.`)

        member.ban({ reason }).then(() => {
            message.channel.send(`<a:lab_verificado:643912897218740224> Banis-te o \`${member.displayName}\` por \`${reason}\`.`);
        }).catch(() => {
            message.reply(`:x: Ocorreu um erro ao tentar banir o \`${member.displayName}\`.`)
        })
    }
};