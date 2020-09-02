const { MessageEmbed } = require('discord.js');
const YouTubeAPI = require('simple-youtube-api');
const ytdl = require('ytdl-core');
const ytinfo = require('updated-youtube-info');
const ytsearch = require('yt-search');
const emojiChar = require('../utils/emojiCharaters');

//URL Regex
//const youtubeTrack = /^(?:https?:\/\/)?(?:www\.)?(?:youtu\.be\/|youtube\.com\/(watch\?v=|watch\?.+&v=))((\w|-){11})(?:\S+)?$/
const youtubePlaylist = /https?:\/\/(www.youtube.com|youtube.com)\/playlist\?list=/g

const yt = new YouTubeAPI(process.env.YouTubeAPIKey);

let queue = {};

function parseDuration(duration) {
    let hours = 0
    let minutes = 0
    let seconds = duration
    while (seconds >= 60) {
        minutes += 1
        seconds -= 60
    }
    while (minutes >= 60) {
        hours += 1
        minutes -= 60
    }
    if (minutes < 10) minutes = `0${minutes}`
    if (seconds < 10) seconds = `0${seconds}`
    return `${hours}:${minutes}:${seconds}`
}

async function sendInfo(id, msg, author, voiceChannel) {
    let title = !queue[voiceChannel.id] || !queue[voiceChannel.id].playing ? "<a:Labfm:482171966833426432> A TOCAR" : ":bookmark_tabs: ADICIONADO NA LISTA"
    ytinfo(id).then(async info => {
        if (title === ":bookmark_tabs: ADICIONADO NA LISTA") {
            queue[voiceChannel.id].queueTitles.push(info.title);
        }
        
        const likes = info.likeCount ? info.likeCount : 'Desativados';
        const dislikes = info.dislikeCount ? info.dislikeCount : 'Desativados';
        await msg.edit(new MessageEmbed()
            .setColor("RANDOM")
            .setTitle(title)
            .addField(":page_with_curl: Nome:", '`' + info.title + '`', true)
            .addField(":eye: Visualizações:", '`' + info.views + '`', true)
            .addField(":calendar: Enviado em:", '`' + info.datePublished + '`', true)
            .addField(":robot: Enviado por:", '`' + info.owner + '`', true)
            .addField(":watch: Duração:", '`' + parseDuration(info.duration) + '`', true)
            .addField(":thumbsup:Likes:", '`' + likes + '`', true)
            .addField(":thumbsdown: Dislikes:", '`' + dislikes + '`', true)
            .setDescription("")
            .setURL(info.url)
            .setThumbnail(info.thumbnailUrl)
            .setTimestamp()
            .setFooter(author.tag, author.displayAvatarURL({ dynamic: true }))
        )
    }).catch(async err => {
        console.log(err)
        await msg.edit(new MessageEmbed()
            .setColor("RANDOM")
            .setTitle(":x: Ocorreu um erro!")
            .setDescription("Ocorreu um erro ao obter a informação dessa música!")
            .setTimestamp()
            .setFooter(author.tag, author.displayAvatarURL({ dynamic: true }))
        )
    })
    msg.reactions.removeAll();
    setTimeout(() => {
        msg.reactions.removeAll();
    }, 5 * 1000)
}

async function play(message, voiceChannel, link) {
    if (!queue[voiceChannel.id])
        queue[voiceChannel.id] = { "queue": [], "queueTitles": [], "playing": false, "paused": false };
    
    if (queue[voiceChannel.id] && queue[voiceChannel.id].playing) {
        return queue[voiceChannel.id].queue.push(link);
    }

    if (link === undefined) {
        message.channel.send('A lista de músicas acabou!');
        voiceChannel.leave();
        delete queue[voiceChannel.id];
        return;
    }

    queue[voiceChannel.id].queue.shift();
    queue[voiceChannel.id].queueTitles.shift();

    await voiceChannel.join().then(async connection => {
        queue[voiceChannel.id].playing = true;
        queue[voiceChannel.id].np = link;
        const dispatcher = await connection.play(await ytdl(link, { highWaterMark: 512 }));

        dispatcher.on('error', err => {
            console.log(err.message);
        });
        dispatcher.on('finish', () => {
            queue[voiceChannel.id].playing = false;
            queue[voiceChannel.id].paused = false;
            if (!queue[voiceChannel.id].queue) {
                message.channel.send('A lista de músicas acabou!');
                delete queue[voiceChannel.id];
                return voiceChannel.leave();
            }
            play(message, voiceChannel, queue[voiceChannel.id].queue[0]);
        })
        module.exports.play = {
            stop: (message, author) => {
                if (voiceChannel.id !== message.guild.member(author).voice.channelID)
                    return message.channel.send(':x: Precisas de estar no meu canal de voz para usares esse comando!');
                if (queue[voiceChannel.id] && queue[voiceChannel.id].playing) {
                    delete queue[voiceChannel.id];
                    dispatcher.destroy();
                    voiceChannel.leave();
                    return message.channel.send('<a:lab_verificado:643912897218740224> Limpei a lista de músicas e parei de tocar música!');
                }else return message.channel.send(':x: Não estou a tocar nada de momento!');
            },
            skip: (message, author) => {
                if (voiceChannel.id !== message.guild.member(author).voice.channelID)
                    return message.channel.send(':x: Precisas de estar no meu canal de voz para usares esse comando!');
                if (queue[voiceChannel.id] && queue[voiceChannel.id].playing) {
                    dispatcher.end();
                    if (queue[voiceChannel.id]) return message.channel.send(':fast_forward: Música pulada!');
                }else return message.channel.send(':x: Não estou a tocar nada de momento!');
            },
            pause: (message, author) => {
                if (voiceChannel.id !== message.guild.member(author).voice.channelID)
                    return message.channel.send(':x: Precisas de estar no meu canal de voz para usares esse comando!');
                if (queue[voiceChannel.id] && queue[voiceChannel.id].playing) {
                    if (!queue[voiceChannel.id].paused) {
                        dispatcher.pause(true);
                        queue[voiceChannel.id].paused = true;
                        return message.channel.send(':pause_button: Música pausada!');
                    }else return message.channel.send(':x: A música já está pausada!');
                }else return message.channel.send(':x: Não estou a tocar nada de momento!');
            },
            resume: (message, author) => {
                if (voiceChannel.id !== message.guild.member(author).voice.channelID)
                    return message.channel.send(':x: Precisas de estar no meu canal de voz para usares esse comando!');
                if (queue[voiceChannel.id] && queue[voiceChannel.id].playing) {
                    if (queue[voiceChannel.id].paused) {
                        dispatcher.resume();
                        queue[voiceChannel.id].paused = false;
                        return message.channel.send(':play_pause: Música a continuar!');
                    }else return message.channel.send(':x: A música já está a tocar!');
                }else return message.channel.send(':x: Não estou a tocar nada de momento!');
            },
            volume: (message, author, volume) => {
                if (voiceChannel.id !== message.guild.member(author).voice.channelID)
                    return message.channel.send(':x: Precisas de estar no meu canal de voz para usares esse comando!');

                if (queue[voiceChannel.id] && queue[voiceChannel.id].playing) {
                    if (!volume) return message.channel.send(`:speaker: Volume atual \`${dispatcher.volume * 100}\``);
                    if (isNaN(volume)) return message.channel.send(':x: Número inválido!');
                    if (volume > 200 && volume < 0) return message.channel.send(':x: O volume apenas pode variar entre <0/200>');
                    
                    const vol = volume / 100;
                    dispatcher.setVolume(vol);
                    return message.channel.send(`:speaker: Volume da música setado para \`${volume}\``);
                }else return message.channel.send(':x: Não estou a tocar nada de momento!');
            },
            queue: (message) => {
                if (!(queue[voiceChannel.id] && queue[voiceChannel.id].queueTitles.length))
                    return message.channel.send(':x: A lista de músicas está vazia!');

                return message.channel.send(`:bookmark_tabs: Lista de músicas: \`${queue[voiceChannel.id].queueTitles.join(', ')}\``, { split: true });
            },
            np: (message) => {
                if (!queue[voiceChannel.id] && !queue[voiceChannel.id].playing) 
                    return message.channel.send(':x: Não estou a tocar nada de momento!');
                const id = ytdl.getURLVideoID(queue[voiceChannel.id].np);
                ytinfo(id).then(info => {
                    return message.channel.send(`<a:Labfm:482171966833426432> A tocar: \`${info.title}\``);
                });
                // simple-youtube-api //Removed because of daily query limit
                /*yt.getVideo(queue[voiceChannel.id].np).then(video => {
                    ytinfo(video.id).then(info => {
                        return message.channel.send(`<a:Labfm:482171966833426432> A tocar: \`${info.title}\``);
                    });
                });*/
            },
            clearqueue: (message, author, index) => {
                if (voiceChannel.id !== message.guild.member(author).voice.channelID)
                    return message.channel.send(':x: Precisas de estar no meu canal de voz para usares esse comando!');

                if (queue[voiceChannel.id] && queue[voiceChannel.id].playing) {
                    if (!index) {
                        queue[voiceChannel.id].queue = [];
                        queue[voiceChannel.id].queueTitles = [];
                        return message.channel.send('<a:lab_verificado:643912897218740224> Lista de músicas foi limpa com sucesso!');
                    }       
                    
                    if (isNaN(index))
                        return message.channel.send(':x: Número inválido!');
                    
                    if (index > queue[voiceChannel.id].queue.length)
                        return message.channel.send(':x: Não há nenhuma música na lista com essa posição!');
    
                    queue[voiceChannel.id].queue.splice(index, queue[voiceChannel.id].queue.length);
                    queue[voiceChannel.id].queueTitles.splice(index, queue[voiceChannel.id].queueTitles.length);
                    return message.channel.send(`<a:lab_verificado:643912897218740224> Música da posição \`${index}\` removida da lista!`);
                }
            }
        }
    }).catch(err => {
        console.log(err);
        queue[voiceChannel.id].playing = false;
    });
}

async function createCollector(results, message, args, author) {
    let reacted = false;
    const voiceChannel = message.guild.member(author).voice.channel;
    const msg = await message.channel.send(
        new MessageEmbed()
            .setColor('RANDOM')
            .setTitle(':notes: Escolhe uma música do YouTube')
            .setDescription(`
            :one: \`${results[0].title}\` \n
            :two: \`${results[1].title}\` \n
            :three: \`${results[2].title}\` \n
            :x: \` CANCELAR \`
            `)
            .setTimestamp()
            .setFooter(author.tag, author.displayAvatarURL({ dynamic: true }))
    );

    const filter = (r, u) => r.me && u.id === author.id;
    const collector = msg.createReactionCollector(filter, { max: 1, time: 30 * 1000 });

    collector.on('collect', async r => {
        switch(r.emoji.name) {
            case emojiChar[1]:
                reacted = true;
                await sendInfo(results[0].videoId, msg, author, voiceChannel);
                await play(message,voiceChannel, results[0].url)
                setTimeout(() => {
                    msg.reactions.removeAll();
                }, 3000);
                break;
            case emojiChar[2]:
                reacted = true;
                await sendInfo(results[1].videoId, msg, author, voiceChannel);
                await play(message, voiceChannel, results[1].url)
                setTimeout(() => {
                    msg.reactions.removeAll();
                }, 2000);
                break;
            case emojiChar[3]:
                reacted = true;
                await sendInfo(results[2].videoId, msg, author, voiceChannel);
                await play(message, voiceChannel, results[2].url)
                setTimeout(() => {
                    msg.reactions.removeAll();
                }, 1000);
                break;
            case '❌':
                reacted = true;
                msg.reactions.removeAll();
                await msg.edit(
                    new MessageEmbed()
                        .setColor('RANDOM')
                        .setTitle('Cancelar')
                        .setDescription(`:x: Pedido \`${args.join(' ')}\` cancelado!`)
                        .setTimestamp()
                        .setFooter(author.tag, author.displayAvatarURL({ dynamic: true }))
                );  
                break;
        }
    });

    const emojis = [emojiChar[1], emojiChar[2], emojiChar[3], "❌"];
    for (const i in emojis) {
        if (!reacted) await msg.react(emojis[i]);
    }
    setTimeout(() => {
        msg.reactions.removeAll();
    }, 30000);
}

module.exports = {
    name: 'play',
    description: 'Toca uma música/playlist, ou adiciona-a na lista de espera.',
    aliases: ['p', 'tocar'], 
    usage: '<musica/yturl>',
    category: 'Musica',
    guildOnly: true,
    cooldown: 1,
    play: {},
    async execute(client, message, args, prefix) {
        if (!args.length)
            return message.channel.send(`:x: Argumentos em falta! **Usa:** ${prefix}play <musica/yturl>`);

        const member = message.member;
        const author = message.author;
        const voiceChannel = member.voice.channel;

        if (!voiceChannel)
            return message.channel.send(':x: Precisas de estar num canal de voz para usar este comando.');

        if (message.guild.member(client.user).voice.channelID && voiceChannel.id !== message.guild.member(client.user).voice.channelID)
            return message.channel.send(':x: Precisas de estar no meu canal de voz para usar esse comando!');

        if (!voiceChannel.joinable)
            return message.channel.send(':x: Não tenho permissão para entrar no teu canal de voz!');

        /*if (args[0].match(youtubeTrack)) {
            yt.getVideo(args[0])
                .then(async video => {
                    if (video) {
                        const msg = await message.channel.send(new MessageEmbed()
                                                            .setColor('RANDOM')
                                                            .setDescription('<a:carregando:488783607352131585> A obter informação da música...'));
                        await sendInfo(video.id, msg, author);
                        await play(message, voiceChannel, video.url);
                    }else return message.channel.send(':x: Vídeo não encontrado.');
            }).catch(console.log);
        }*/

        if (ytdl.validateURL(args[0])) {
            const id = ytdl.getURLVideoID(args[0]);
            const url = ytdl.getVideoID(id);

            if (id && url) {
                const msg = await message.channel.send(new MessageEmbed()
                                                            .setColor('RANDOM')
                                                            .setDescription('<a:carregando:488783607352131585> A obter informação da música...'));
                await sendInfo(id, msg, author, voiceChannel);
                await play(message, voiceChannel, url);
            }else return message.channel.send(':x: Vídeo não encontrado.');
        }else if (args[0].match(youtubePlaylist)) {
            yt.getPlaylist(args[0])
                .then(playlist => {
                    if (playlist) {
                        playlist.getVideos()
                            .then(async videos => {
                                for (let i = 0; i < videos.length; i++) {
                                    const msg = await message.channel.send(
                                        new MessageEmbed()
                                            .setColor('RANDOM')
                                            .setDescription('<a:carregando:488783607352131585> A obter informação da playlist...')
                                    )
                                    await sendInfo(videos[i].id, msg, author, voiceChannel);
                                    await play(message, voiceChannel, videos[i].url);
                                }
                        }).catch(console.log);
                    }
            }).catch(err => {
                console.log(err.message);
                message.channel.send(':x: Ocorreu um erro ao obter a playlist.');
            });
        }else {
            if (args[0].startsWith('http') || args[0].startsWith('www.'))
                return message.channel.send(':x: Só consigo tocar links do YouTube.');
            message.channel.send(`A procurar \`${args.join(' ')}\` :mag:`);
            ytsearch(args.join(' '), async (err, results) => {
                if (err)
                    return message.channel.send(':x: Ocorreu um erro!');
                if (!results.videos.length)
                    return message.channel.send(`:x: Nenhuns resultados encontrados para \`${args.join(' ')}\``);
                await createCollector(results.videos, message, args, message.author);
            });
            /*yt.searchVideos(args.join(' '), 3)
                .then(async results => {
                    if (!results)
                        return message.channel.send(`:x: Nenhuns resultados encontrados para \`${args.join(' ')}\``);

                    await createCollector(results, message, args, message.author);
            }).catch(console.log);*/
        }
    }   
}