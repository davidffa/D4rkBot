module.exports = {
    name: 'ban',
    description: 'Bane alguém', 
    usage: '<@user/ID> [motivo]',
    category: 'Moderation',
    args: 1,
    guildOnly: true,
    cooldown: 3,
    async execute(client, message, args) { 
        if (!message.member.hasPermission('BAN_MEMBERS')) return message.reply(':x: Não tens permissão para banir membros!');
        if (!message.guild.member(client.user.id).hasPermission('BAN_MEMBERS')) return message.channel.send(':x: Não tenho permissão para banir membros!');

        let user = message.mentions.users.first();
        if (!user) {
            if (!isNaN(args[0]) && (args[0].length === 17 || args[0].length === 18 || args[0].length === 19)) {
                try {
                    user = client.users.cache.get(args[0])
                        ? client.users.cache.get(args[0]) 
                        : await client.users.fetch(args[0]);
                }catch {}   
            }
            if (!user)
                return message.reply(':x: Utilizador inválido!');
        }

        const member = message.guild.member(user);

        if (member) {
            if (member.id === client.user.id) return message.reply(':x: Não me consigo banir a mim próprio!');
            if (!member.bannable) return message.reply(`:x: Não tenho permissão para banir o \`${user.tag}\`.`);
        }

        const reason = args.slice(1).join(' ') || 'Sem motivo';

        message.guild.members.ban(user, { reason }).then(() => {
            message.channel.send(`<a:lab_verificado:643912897218740224> Banis-te o \`${user.tag}\` por \`${reason}\`.`);
        }).catch(() => {
            message.reply(`:x: Ocorreu um erro ao tentar banir o \`${user.tag}\`.`)
        });
    }
};