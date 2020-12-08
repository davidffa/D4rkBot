module.exports.run = async (client, oldState, newState) => {
    if (oldState.guild.id === process.env.TESTGUILDID) return;

    const voiceChannel = oldState.channel;
    const voiceChannel2  = newState.channel;

    //Record
    if (voiceChannel && client.records.get(oldState.guild.id) && client.records.get(oldState.guild.id).userID === oldState.member.id)
        return client.records.get(oldState.guild.id).audioStream.destroy();

    //Music
    if (oldState.member === oldState.guild.me && voiceChannel && !voiceChannel2) {
        const player = client.music.players.get(oldState.guild.id);
        if (player) {
            client.channels.cache.get(player.textChannel).send(':warning: Fui desconectado do canal de voz, por isso limpei a queue.');
            player.destroy();
        }
    }

    if (client.music.players.get(oldState.guild.id) && voiceChannel && voiceChannel.id === client.music.players.get(oldState.guild.id).voiceChannel) {
        if (voiceChannel.members.filter(member => !member.user.bot).size === 0) {
            client.music.players.get(oldState.guild.id).pause(true);
            const msg = await client.channels.cache.get(client.music.players.get(oldState.guild.id).textChannel).send(':warning: Pausei a música porque fiquei sozinho no canal de voz, se ninguem aparecer irei sair em 2 minutos.');
            const timeout = setTimeout(() => {
                const player = client.music.players.get(oldState.guild.id);
                if (player) {
                    client.channels.cache.get(client.music.players.get(oldState.guild.id).textChannel).send(':x: Saí do canal de voz porque fiquei sozinho mais de 2 minutos.');
                    player.destroy();
                    client.voiceStateTimeouts.get(newState.guild.id).message.delete();
                    client.voiceStateTimeouts.delete(newState.guild.id);
                }
            }, 2 * 60 * 1000);
            client.voiceStateTimeouts.set(oldState.guild.id, { timeout, message: msg });
        }
    }

    if (client.music.players.get(newState.guild.id) && voiceChannel2 && voiceChannel2.id === client.music.players.get(newState.guild.id).voiceChannel) {
        if (client.voiceStateTimeouts.has(newState.guild.id)) {
            client.music.players.get(newState.guild.id).pause(false);
            clearTimeout(client.voiceStateTimeouts.get(newState.guild.id).timeout);
            client.voiceStateTimeouts.get(newState.guild.id).message.delete();
            client.voiceStateTimeouts.delete(newState.guild.id);
        }
    }
}