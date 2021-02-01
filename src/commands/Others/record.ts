import Command from '../../structures/Command';
import Client from '../../structures/Client';

import { Message } from 'eris';

import fs from 'fs';
import { resolve } from 'path';

import { exec } from 'child_process';

class Record extends Command {
    constructor(client: Client) {
        super(client, {
            name: 'record',
            description: 'Grava áudio no canal de voz e envia em MP3',
            category: 'Others',
            aliases: ['gravar', 'rec', 'gravaraudio', 'recordaudio'],
            cooldown: 8
        });
    }

    async execute(message: Message): Promise<void> {
        if (message.channel.type !== 0) return;

        const voiceChannelID = message.member?.voiceState.channelID;

        if (!voiceChannelID) {
            message.channel.createMessage(':x: Precisas de estar num canal de voz para usar esse comando!');
            return;
        }

        if (this.client.music.players.get(message.guildID as string)) {
            message.channel.createMessage(':x: Não consigo gravar voz enquanto toco música!');
            return;
        }

        if (message.channel.guild.voiceStates.get(this.client.user.id) && message.channel.guild.voiceStates.get(this.client.user.id)?.channelID !== voiceChannelID) {
            message.channel.createMessage(':x: Precisas de estar no meu canal de voz para usar este comando!');
            return;
        }

        const voiceChannel = this.client.getChannel(voiceChannelID);
        if (!voiceChannel || voiceChannel.type !== 2) return;

        const saveRec = async (): Promise<void> => {
            if (message.channel.type !== 0) return;

            voiceChannel.leave();

            const data = this.client.records.get(message.guildID as string);
            data && clearTimeout(data.timeout);

            if (!data || !data.users.length) {
                message.channel.createMessage(':x: Gravação de áudio vazia!');
                this.client.records.delete(message.guildID as string);
                return;
            }

            const msg = await message.channel.createMessage('<a:loading2:805088089319407667> A processar o áudio...');

            let cmd: string;

            const getFilePath = (name: string): string => {
                return resolve(__dirname, '..', '..', '..', 'records', `${name}`);
            }

            if (data.users.length === 1) {
                cmd = `ffmpeg -f s16le -ar 48k -ac 2 -i ${getFilePath(`${message.guildID}-${data.users[0]}.pcm`)} ${getFilePath(`${message.guildID}.mp3`)}`;
            }else {
                cmd = `ffmpeg ${data.users.map(u => `-f s16le -ar 48k -ac 2 -i ${getFilePath(`${message.guildID}-${u}.pcm`)}`).join(' ')} -filter_complex amix=inputs=${data.users.length}:duration=longest ${getFilePath(`${message.guildID}.mp3`)}`;
            }

            exec(cmd, async () => {
                msg.delete().catch(() => {});

                const mp3filePath = resolve(__dirname, '..', '..', '..', 'records', `${message.guildID}.mp3`);
                const buffer = fs.readFileSync(mp3filePath);

                await message.channel.createMessage(`:red_circle: Gravação de áudio terminada!`, {
                    name: 'áudio.mp3',
                    file: buffer
                });

                fs.unlinkSync(mp3filePath);
                data.users.forEach(u => {
                    fs.unlinkSync(resolve(__dirname, '..', '..', '..', 'records', `${message.guildID}-${u}.pcm`));
                })

                this.client.records.delete(message.guildID as string);
            })
        }

        if (this.client.records.has(message.guildID as string)) {
            saveRec();
            return;
        }

        const permissions = voiceChannel.permissionsOf(this.client.user.id);
        
        if (!permissions.has('readMessages')) {
            message.channel.createMessage(':x: Não tenho permissão para ver o teu canal de voz!');
            return;
        }

        if (!permissions.has('voiceConnect')) {
            message.channel.createMessage(':x: Não tenho permissão para entrar no teu canal de voz!');
            return;
        }

        if (!permissions.has('voiceSpeak')) {
            message.channel.createMessage(':x: Não tenho permissão para falar no teu canal de voz!');
            return;
        }

        if (voiceChannel.userLimit && voiceChannel.voiceMembers.size > voiceChannel.userLimit) {
            message.channel.createMessage(':x: O canal de voz está cheio!');
            return;
        }

        if (!fs.existsSync('./records'))
            fs.mkdirSync('./records');

        const connection = await voiceChannel.join({ opusOnly: false, shared: false });
        
        const stream = connection.receive('pcm');
        
        stream.on('data', (data, userID) => {
            if (!userID) return;
            if (!this.client.records.get(message.guildID as string)?.users.includes(userID)) this.client.records.get(message.guildID as string)?.users.push(userID);
            fs.appendFileSync(resolve(__dirname, '..', '..', '..', 'records', `${message.guildID}-${userID}.pcm`), data);
        });

        const timeout = setTimeout(() => {
            saveRec();
        }, 2 * 60 * 1000);

        this.client.records.set(message.guildID as string, { timeout, users: [] });

        message.channel.createMessage(':red_circle: Gravação de áudio iniciada, execute o comando de novo para parar a gravação!\nTempo máximo: `2 minutos`')
    }
}

module.exports = Record;