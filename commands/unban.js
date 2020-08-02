module.exports = {
    name: 'unban',
    description: 'Tira o ban a alguém', 
    usage: '<user>',
    category: 'Admin',
    guildOnly: true,
    cooldown: 3,
    args: 1,
    async execute(client, message, args, prefix) { 
        if (!message.member.hasPermission('BAN_MEMBERS')) return message.reply(':x: Não tens permissão para desbanir membros!');
        if (!message.guild.member(client.user.id).hasPermission('BAN_MEMBERS')) return message.channel.send(':x: Não tenho permissão para desbanir membros!');

        const bans = await message.guild.fetchBans();
        bans.map(user => {
            if (user.user.username.toLowerCase().startsWith(args[0].toLowerCase())) {
                message.guild.members.unban(user.user.id).then(usr => {
                    message.channel.send(`<a:lab_verificado:643912897218740224> Desbanis-te o \`${usr.username}\`.`)
                }).catch(err => {
                    message.channel.send(':x: Ocorreu um erro!');
                    console.error(err.message);
                });
            }
        });
    }
};