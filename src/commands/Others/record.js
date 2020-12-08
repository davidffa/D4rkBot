const fs = require('fs');
const path = require('path');
const Lame = require('node-lame').Lame;
const { Readable } = require('stream')

module.exports = {
    name: 'record',
    description: 'Grava áudio no canal de voz e envia um anexo em .mp3.\nIdeia original de 5antos#4876 (617739561488875522)',
    aliases: ['gravar', 'gravaraudio', 'recordaudio', 'rec'],
    category: 'Outros',
    cooldown: 10,
    async execute(client, message) {
        const voiceChannel = message.member.voice.channel;

        if (!voiceChannel)
            return message.channel.send(':x: Precisas de estar num canal de voz para executar esse comando!');

        if (message.guild.me.voice.channel && message.guild.me.voice.channel.id !== message.member.voice.channel.id)
            return message.channel.send(':x: Precisas de estar no meu canal de voz para usar esse comando!');

        if (client.music.players.get(message.guild.id))
            return message.channel.send(':x: Não consigo gravar voz enquanto toco música!');

        const permissions = voiceChannel.permissionsFor(client.user);

        if (!permissions.has('CONNECT'))
            return message.channel.send(':x: Não tenho permissão para entrar no teu canal de voz!');

        if (!permissions.has('SPEAK'))
            return message.channel.send(':x: Não tenho permissão para falar no teu canal de voz!');

        if (voiceChannel.full) 
            return message.channel.send(':x: O canal de voz está cheio!');

        if (client.records.get(message.guild.id)) {
            if (client.records.get(message.guild.id).userID === message.author.id) {
                return client.records.get(message.guild.id).audioStream.destroy();
            }
            return message.channel.send(`:x: Apenas o ${message.guild.members.cache.get(client.records.get(message.guild.id).userID).displayName} pode parar a gravação!`);
        }

        if (!fs.existsSync('./records'))
            fs.mkdirSync('./records')

        const connection = await voiceChannel.join();
        await connection.play(new Silence(), { type: 'opus' });

        const filePath = path.resolve(__dirname, '..', '..', '..', 'records', `${Date.now()}-${message.author.id}-record.pcm`);
        const mp3FilePath = filePath.replace('.pcm', '.mp3');

        const audioStream = connection.receiver.createStream(message.author, {
            mode: 'pcm',
            end: 'manual'
        });

        audioStream.pipe(fs.createWriteStream(filePath, { flags: 'w' }));

        await message.channel.send(':red_circle: Gravação de áudio iniciada, execute o comando de novo para parar a gravação!\nTempo máximo: `1 minuto`');

        audioStream.on('close', () => {
            saveRecord();
        });

        const timeout = setTimeout(() => {
            saveRecord();
        }, 60000);

        client.records.set(message.guild.id, { userID: message.author.id, audioStream, timeout });

        async function saveRecord() {
            const encoder = new Lame({
                output: mp3FilePath,
                raw: true,
                bitrate: 192,
                scale: 3,
                sfreq: 48,
            }).setFile(filePath);

            await encoder.encode();

            await message.channel.send(`:red_circle: Gravação de áudio de ${message.member.displayName} terminada!`, {
                files: [{
                    attachment: mp3FilePath,
                    name: `Áudio de ${message.member.displayName}.mp3`
                }]
            });

            fs.unlinkSync(filePath);
            fs.unlinkSync(mp3FilePath);
            message.guild.me.voice.channel.leave();

            clearTimeout(client.records.get(message.guild.id).timeout);
            client.records.delete(message.guild.id);
        }
    }
}

class Silence extends Readable {
    _read() {
        this.push(Buffer.from([0xF8, 0xFF, 0xFE]));
    }
}
