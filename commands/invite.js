module.exports = {
    name: 'invite',
    description: 'Link do meu convite.',
    aliases: ['convite', 'inv'], 
    category: 'info',
    cooldown: 3,
    execute(client, message, args, prefix) {
        message.channel.send('https://discord.com/oauth2/authorize?client_id=499901597762060288&scope=bot&permissions=8');
    }
}