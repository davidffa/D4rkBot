import Command from '../structures/Command';
import Client from '../structures/Client';

import { Message, Emoji, Member } from 'eris';
import { ReactionCollector } from 'eris-collector';

export default class Help extends Command {
    constructor(client: Client) {
        super(client, {
            name: 'help',
            description: 'Lista de todos os comandos ou informações de um comando específico.',
            aliases: ['comandos', 'cmd', 'cmds', 'ajuda', 'ajd', 'cmdlist', 'commandlist'],
            cooldown: 5,
            dm: true
        })
    }

    async execute(message: Message, args: Array<string>): Promise<void> {
        if (message.channel.type === 0 && !message.channel.permissionsOf(this.client.user.id).has('embedLinks')) {
            message.channel.createMessage(':x: Preciso da permissão `EMBED_LINKS` para executar este comando');
            return;
        }

        const Mod: Array<string> = [];
        const Settings: Array<string> = [];
        const Dev: Array<string> = [];
        const Info: Array<string> = [];
        const Music: Array<string> = [];
        const Others: Array<string> = [];

        const commands = this.client.commands;

        const embed = new this.client.embed()
            .setColor('RANDOM')
            .setTitle('Ajuda')
            .setFooter(`${message.author.username}#${message.author.discriminator}`, message.author.dynamicAvatarURL())
            .setTimestamp();

        if (!args.length) {
            embed.setDescription(`Lista de todos os meus comandos [${message.author.id === '334054158879686657' ? this.client.commands.length : this.client.commands.length - 3}]:`);
            commands.forEach(cmd => {
                switch (cmd.category) {
                    case 'Moderation':
                        Mod.push(cmd.name);
                        break;
                    case 'Settings':
                        Settings.push(cmd.name);
                        break;
                    case 'Dev':
                        message.author.id === '334054158879686657' && Dev.push(cmd.name);
                        break;
                    case 'Info':
                        Info.push(cmd.name);
                        break;
                    case 'Music':
                        Music.push(cmd.name);
                        break;
                    case 'Others':
                        Others.push(cmd.name);
                        break;
                    default:
                        Others.push(cmd.name);
                        break;
                }
            });

            embed.addField(`> :cop: Moderação [${Mod.length}]`, `\`\`\`${Mod.join(' | ')}\`\`\``)
                .addField(`> :gear: Definições [${Settings.length}]`, `\`\`\`${Settings.join(' | ')}\`\`\``);

            message.author.id === '334054158879686657' && embed.addField(`> <:lang_js:803678540528615424> Desenvolvedor [${Dev.length}]`, `\`\`\`${Dev.join(' | ')}\`\`\``);
            
            embed.addField(`> :information_source: Informação [${Info.length}]`, `\`\`\`${Info.join(' | ')}\`\`\``)
                .addField(`> <a:disco:803678643661832233> Musica [${Music.length}]`, `\`\`\`${Music.join(' | ')}\`\`\``)
                .addField(`> :books: Outros [${Others.length}]`, `\`\`\`${Others.join(' | ')}\`\`\``)
                .addField(`:thinking: Mais ajuda`, `Faz \`${(message.channel.type === 0 && message.channel.guild.dbCache.prefix) || 'db.'}help <nome do comando>\` para obter informação sobre um comando`)
                .addField(`<:megathink:803675654376652880> Ainda mais ajuda`, '[Servidor de Suporte](https://discord.gg/dBQnxVCTEw)')
            
            const msg = await message.channel.createMessage({ embed });
            await msg.addReaction('x_:751062867444498432');

            const filter = (_m: Message, emoji: Emoji, member: Member) => emoji.id === '751062867444498432' && member === message.member;

            const collector = new ReactionCollector(this.client, msg, filter, { time: 5 * 60 * 1000 });
            
            collector.on('collect', m => {
                m.delete();
            });

            collector.on('end', (_c, reason) => {
                if (reason === 'time')
                    msg.removeReaction('x_:751062867444498432');
            });

            return;
        }

        const name = args[0].toLowerCase();
        const cmd = commands.filter(c => message.author.id === '334054158879686657' || c.category !== 'Dev').find(c => c.name === name || c.aliases?.includes(name));

        if (!cmd) {
            embed.setTitle('Comando não encontrado')
            embed.setDescription(`:x: Não tenho nenhum comando com o nome \`${name}\``);
            message.channel.createMessage({ embed });
            return;
        }

        const data = [];

        data.push(`**Nome:** ${cmd.name}`);
        data.push(`**Descriçao:** ${cmd.description}`);
        cmd.aliases && data.push(`**Alternativas:** ${cmd.aliases.join(', ')}`);
        cmd.usage && data.push(`**Uso:** ${(message.channel.type === 0 && message.channel.guild.dbCache.prefix) || 'db.'}${cmd.name} ${cmd.usage}`);

        data.push(`**Cooldown:** ${cmd.cooldown || 3} segundo(s)`);

        embed.setTitle(`Ajuda do comando ${args[0]}`)
        embed.setDescription(data.join('\n'))
        message.channel.createMessage({ embed });
    }
}