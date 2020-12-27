module.exports = {
    name: 'unban',
    description: 'Tira o ban a alguém',
    usage: '<user/ID>',
    category: 'Moderation',
    guildOnly: true,
    cooldown: 5,
    args: 1,
    async execute(client, message, args) {
        if (!message.member.hasPermission('BAN_MEMBERS')) return message.reply(':x: Não tens permissão para desbanir membros!');
        if (!message.guild.member(client.user.id).hasPermission('BAN_MEMBERS')) return message.channel.send(':x: Não tenho permissão para desbanir membros!');

        const bans = await message.guild.fetchBans();
        const member = bans.find(m => m.user.id === args[0]) || bans.find(m => m.user.tag.toLowerCase().startsWith(args.join(' ').toLowerCase()));
        
        if (!member)
            return message.channel.send(':x: Membro não encontrado!');

        message.guild.members.unban(member.user.id).then(usr => {
            message.channel.send(`<a:lab_verificado:643912897218740224> Desbanis-te o \`${usr.tag}\`.`)
        }).catch(err => {
            message.channel.send(':x: Ocorreu um erro!');
            console.error(err.message);
        });
    }
};