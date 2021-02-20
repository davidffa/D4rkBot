import Command from '../../structures/Command';
import Client from '../../structures/Client';

import { Message, Emoji, Member } from 'eris';

import { ReactionCollector, MessageCollector } from 'eris-collector';

class Logs extends Command {
    constructor(client: Client) {
        super(client, {
            name: 'logs',
            description: 'Configura os canais onde irei enviar as logs (mensagem bem-vindo etc)',
            category: 'Settings',
            aliases: ['setlogs', 'configlogs'],
            cooldown: 5,
        });
    }

    async execute(message: Message): Promise<void> {
        if (message.channel.type !== 0) return;

        if (!message.channel.permissionsOf(message.author.id).has('manageMessages') && message.author.id !== '334054158879686657') {
            message.channel.createMessage(':x: Precisas da permissão `Gerenciar Mensagens` para usar este comando!');
            return;
        }

        if (!message.channel.permissionsOf(this.client.user.id).has('addReactions')) {
            message.channel.createMessage(':x: Preciso da permissão `Adicionar Reações` para executar este comando');
            return;
        }

        if (!message.channel.permissionsOf(this.client.user.id).has('embedLinks')) {
            message.channel.createMessage(':x: Preciso da permissão `Inserir Links` para executar este comando');
            return;
        }

        const guildData = this.client.guildCache.get(message.guildID as string);
        const welcomeChannel = message.channel.guild.channels.get(guildData?.welcomeChatID || '');
        const byeChannel = message.channel.guild.channels.get(guildData?.memberRemoveChatID || '');

        const embed = new this.client.embed()
            .setColor('RANDOM')
            .setTitle('Configurar logs')
            .setDescription(`:one: Canal das mensagens de bem-vindo: \`${welcomeChannel ? `${welcomeChannel.name}` : 'Nenhum'}\`\n\n:two: Canal das mensagens de saídas de membros: \`${byeChannel ? `${byeChannel.name}` : 'Nenhum'}\``)
            .setTimestamp()
            .setFooter(`${message.author.username}#${message.author.discriminator}`, message.author.dynamicAvatarURL());

        const msg = await message.channel.createMessage({ embed });
        msg.addReaction('1⃣');
        msg.addReaction('2⃣');

        const welcomeMsgCollector = (): void => {
            const filter = (m: Message) => m.author.id === message.author.id;
            const collector = new MessageCollector(this.client, message.channel, filter, { max: 1, time: 20000 });
        
            collector.on('collect', async (m) => {
                if (m.channel.type !== 0) return;
                msg.delete().catch(() => {});

                if (!guildData) return;

                if (m.content === '0') {
                    guildData.welcomeChatID = '';

                    const guildDBData = await this.client.guildDB.findOne({ guildID: m.guildID });
                
                    if (guildDBData) {
                        guildDBData.welcomeChatID = '';
                        guildDBData.save();
                    }

                    message.channel.createMessage('<a:verificado:803678585008816198> Logs de bem-vindo desativadas!');
                    return;
                }

                const channel = m.channel.guild.channels.get(m.channelMentions[0])
                    || m.channel.guild.channels.get(m.content)
                    || m.channel.guild.channels.find(ch => ch.name === m.content)
                    || m.channel.guild.channels.find(ch => ch.name.toLowerCase().includes(m.content.toLowerCase()));

                if (!channel) {
                    m.channel.createMessage(':x: Canal não encontrado');
                    return;
                }

                guildData.welcomeChatID = channel.id;

                const guildDBData = await this.client.guildDB.findOne({ guildID: m.guildID });
                
                if (guildDBData) {
                    guildDBData.welcomeChatID = channel.id;
                    guildDBData.save();
                }else {
                    this.client.guildDB.create({ 
                        guildID: message.guildID,
                        welcomeChatID: channel.id
                    });
                }

                message.channel.createMessage(`<a:verificado:803678585008816198> Canal de bem-vindo setado para \`${channel.name}\`.`);
            });
        }

        const byeMsgCollector = (): void => {
            const filter = (m: Message) => m.author.id === message.author.id;
            const collector = new MessageCollector(this.client, message.channel, filter, { max: 1, time: 20000 });
        
            collector.on('collect', async (m) => {
                if (m.channel.type !== 0) return;
                msg.delete().catch(() => {});
                if (!guildData) return;

                if (m.content === '0') {
                    guildData.memberRemoveChatID = '';

                    const guildDBData = await this.client.guildDB.findOne({ guildID: m.guildID });
                
                    if (guildDBData) {
                        guildDBData.memberRemoveChatID = '';
                        guildDBData.save();
                    }

                    message.channel.createMessage('<a:verificado:803678585008816198> Logs de bem-vindo desativadas!');
                    return;
                }

                const channel = m.channel.guild.channels.get(m.channelMentions[0])
                    || m.channel.guild.channels.get(m.content)
                    || m.channel.guild.channels.find(ch => ch.name === m.content)
                    || m.channel.guild.channels.find(ch => ch.name.toLowerCase().includes(m.content.toLowerCase()));

                if (!channel) {
                    m.channel.createMessage(':x: Canal não encontrado');
                    return;
                }

                guildData.memberRemoveChatID = channel.id;

                const guildDBData = await this.client.guildDB.findOne({ guildID: m.guildID });
                
                if (guildDBData) {
                    guildDBData.memberRemoveChatID = channel.id;
                    guildDBData.save();
                }else {
                    this.client.guildDB.create({ 
                        guildID: message.guildID,
                        memberRemoveChatID: channel.id
                    });
                }

                message.channel.createMessage(`<a:verificado:803678585008816198> Canal de saídas de membros setado para \`${channel.name}\`.`);
            });
        }

        const filter = (_m: Message, emoji: Emoji, member: Member) => (emoji.name === '1⃣' || emoji.name === '2⃣') && member === message.member;
        const collector = new ReactionCollector(this.client, msg, filter, { max: 1, time: 3 * 60 * 1000 });

        collector.on('collect', async (_m, emoji) => {
            switch (emoji.name) {
                case '1⃣':
                    message.channel.createMessage('Escreva o ID ou o nome do canal para onde as mensagens de bem-vindo irão (Escreva 0 para desativar).');
                    welcomeMsgCollector();
                    break;
                case '2⃣':
                    message.channel.createMessage('Escreva o ID ou o nome do canal para onde as mensagens de saída de membros irão (Escreva 0 para desativar).');
                    byeMsgCollector();
                    break;
            }
            msg.removeReaction('1⃣');
            msg.removeReaction('2⃣');
        });

        collector.on('end', (_c, reason) => {
            if (reason === 'time') {
                msg.removeReaction('1⃣');
                msg.removeReaction('2⃣');
            }  
        });
    }
}

module.exports = Logs;