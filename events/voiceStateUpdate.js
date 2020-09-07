module.exports.run = (client, oldState, newState) => {
    const voiceChannel = oldState.channel;
    const voiceChannel2  = newState.channel;

    if (client.music.players.get(oldState.guild.id) && voiceChannel === client.music.players.get(oldState.guild.id).voiceChannel) {
        if (voiceChannel.members.size === 1) {
            const timeout = setTimeout(() => {
                client.music.players.destroy(oldState.guild.id);
            }, 5 * 60 * 1000);
            client.voiceStateTimeouts.set(oldState.guild.id, timeout);
        }
    }

    if (client.music.players.get(newState.guild.id) && voiceChannel2 === client.music.players.get(newState.guild.id).voiceChannel) {
        if (client.voiceStateTimeouts.has(newState.guild.id)) {
            clearTimeout(client.voiceStateTimeouts.get(newState.guild.id));
            client.voiceStateTimeouts.delete(newState.guild.id);
        }
    }
}