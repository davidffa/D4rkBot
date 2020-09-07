module.exports = {
    name: 'seek',
    description: 'Avança para um tempo específico da música',
    category: 'Musica',
    usage: '<Tempo>',
    guildOnly: true,
    cooldown: 5,
    args: 1,
    execute(client, message, args) {
        const player = client.music.players.get(message.guild.id);

        if (!player || !player.queue[0])
            return message.channel.send(':x: Não estou a tocar nada de momento!');

        const voiceChannel = message.member.voice.channel;

        if (!voiceChannel) 
            return message.channel.send(':x: Precisas de estar num canal de voz para executar esse comando!');

        if (Number(args[0]) < 0 || Number(args[0]) > player.queue[0].duration) 
            return message.channel.send(`:x: O tempo tem de variar entre \`0 e ${player.queue[0].duration / 1000}\` segundos`)
        
        player.seek(args[0]*1000);
        message.channel.send(`<a:lab_verificado:643912897218740224> Tempo da música setado para \`${args[0]}\` segundos`);
    }
}