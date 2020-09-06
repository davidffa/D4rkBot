module.exports = {
    name: 'queue',
    description: 'Vê as músicas que estão na queue',
    category: 'Musica',
    guildOnly: true,
    cooldown: 5,
    execute(client, message) {
        const player = client.music.players.get(message.guild.id);

        if (!player)
            return message.channel.send(':x: Não estou a tocar nada de momento!');

        message.channel.send(`:bookmark_tabs: Lista de músicas: \`${player.queue.map(queueItem => queueItem.title)}\``, { split: true });
    }
}