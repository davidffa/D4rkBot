module.exports = {
    name: 'banlist',
    description: 'Lista de bans',
    category: 'Admin',
    guildOnly: true,
    cooldown: 3,
    async execute(client, message) { 
        if (!message.member.hasPermission('BAN_MEMBERS')) return message.reply(':x: Não tens permissão para ver a lista de membros banidos!');
        if (!message.guild.me.hasPermission('BAN_MEMBERS')) return message.channel.send(':x: Não tenho permissão para ver a lista de membros banidos!');

        let msg = '';

        const bans = await message.guild.fetchBans();

        if (!bans.first())
            return message.channel.send(':x: Este servidor não tem membros banidos!');
        bans.map(user => {
            msg += `\`${user.user.tag}\`, `;
        });

        message.channel.send(':bookmark_tabs: Lista de membros banidos:\n' + msg, { split: true });
    }
};