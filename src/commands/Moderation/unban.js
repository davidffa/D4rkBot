module.exports = {
    name: 'unban',
    description: 'Tira o ban a alguém',
    usage: '<user>',
    category: 'Moderation',
    guildOnly: true,
    cooldown: 3,
    args: 1,
    async execute(client, message, args) {
        if (!message.member.hasPermission('BAN_MEMBERS')) return message.reply(':x: Não tens permissão para desbanir membros!');
        if (!message.guild.member(client.user.id).hasPermission('BAN_MEMBERS')) return message.channel.send(':x: Não tenho permissão para desbanir membros!');

        const bans = await message.guild.fetchBans();
        const user = bans.filter(user => user.user.tag.toLowerCase().startsWith(args[0].toLowerCase())).first();
        
        if (!user)
            return message.channel.send(':x: Membro não encontrado!');

        message.guild.members.unban(user.user.id).then(usr => {
            message.channel.send(`<a:lab_verificado:643912897218740224> Desbanis-te o \`${usr.tag}\`.`)
        }).catch(err => {
            message.channel.send(':x: Ocorreu um erro!');
            console.error(err.message);
        });
    }
};