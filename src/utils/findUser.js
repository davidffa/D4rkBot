module.exports = async (client, guild, args) => {
    let user;

    if (!isNaN(args[0]) && (args[0].length === 17 || args[0].length === 18 || args[0].length === 19)) {
        try {
            user = client.users.cache.get(args[0])
                ? client.users.cache.get(args[0]) 
                : await client.users.fetch(args[0]);
        }catch {}   
    }

    if (!user) {
        const member = guild.members.cache.find(m => m.displayName === args.join(' ')) 
            || guild.members.cache.find(m => m.displayName.toLowerCase().startsWith(args.join(' ').toLowerCase()));

        if (member) user = member.user;
    }
    return user;
}