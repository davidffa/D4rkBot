module.exports = {
    name: 'banlist',
    description: 'Lista de bans',
    category: 'Admin',
    guildOnly: true,
    cooldown: 3,
    async execute(client, message) { 
        if (!message.member.hasPermission('BAN_MEMBERS')) return message.reply(':x: Não tens permissão para ver a lista de membros banidos!');
        if (!message.guild.member(client.user.id).hasPermission('BAN_MEMBERS')) return message.channel.send(':x: Não tenho permissão para ver a lista de membros banidos!');

        let msg = '';

        const bans = await message.guild.fetchBans();
        bans.map(user => {
            msg += user.user.username;
        });

        if (msg === '') {
            message.channel.send('Este servidor não tem membros banidos!');
        }else {
            message.channel.send(':bookmark_tabs: Lista de membros banidos:\n' + msg);
        }
    }
};