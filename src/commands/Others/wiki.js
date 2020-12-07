const { MessageEmbed } = require('discord.js');
const algorithmia = require('algorithmia');
const sbd = require('sbd');

module.exports = {
    name: 'wiki',
    description: 'Procura algo na wikipedia',
    aliases: ['wikipedia'], 
    category: 'Outros',
    args: 1,
    usage: '<Palavra/Frase>',
    cooldown: 3,
    async execute(_client, message, args) {
        let content = args.join(' ');

        const input = {
            'articleName': content,
            'lang': 'pt'
        };

        const msg = await message.channel.send('<a:lab_loading:643912893011853332> A procurar...');
        let url = '';

        await fetchContentFromWikipedia();
        if (content == args.join(' ')) return;

        sanitizeContent();

        content = sbd.sentences(content);
        content = content.slice(0, 5);
        
        await msg.edit('', new MessageEmbed()
            .setTitle(`Wikipedia: (${args.join(' ')})`)
            .setColor('RANDOM')
            .setThumbnail('https://www.wikipedia.org/portal/wikipedia.org/assets/img/Wikipedia-logo-v2.png')
            .setDescription(content.join('\n'))
            .setURL(url)
            .setFooter(`${message.author.tag}`, message.author.displayAvatarURL({ dynamic: true }))
            .setTimestamp());

        async function fetchContentFromWikipedia() {   
            const algorithmiaAuthenticated = algorithmia(process.env.AlgorithmiaKey);
            const wikipediaAlgorithm = algorithmiaAuthenticated.algo('web/WikipediaParser/0.1.2?timeout=300');
            const wikipediaResponse = await wikipediaAlgorithm.pipe(input);
            try {
                const wikipediaContent = wikipediaResponse.get();
                url = wikipediaContent.url;
                content = wikipediaContent.content;
            }catch(err) {
                return await msg.edit(`:x: Não encontrei nada na wikipédia para \`${args.join(' ')}\``)
            }
        }

        function sanitizeContent() {
            const withoutBlankLinesAndMarkdown = removeBlankLinesAndMarkdown();
            const withoutDatesInParenteses = removeDatesInParentheses(withoutBlankLinesAndMarkdown);
            content = withoutDatesInParenteses;

            function removeBlankLinesAndMarkdown() {
                const allLines = content.split('\n');

                const withoutBlankLinesAndMarkdown = allLines.filter((line) => {
                    if (line.trim().length === 0 || line.trim().startsWith('=')) {
                        return false;
                    }
                    return true;
                });

                return withoutBlankLinesAndMarkdown.join(' ');
            }

            function removeDatesInParentheses(text) {
                return text.replace(/\((?:\([^()]*\)|[^()])*\)/gm, '').replace(/  /g, ' ');
            }
        }
    }
}