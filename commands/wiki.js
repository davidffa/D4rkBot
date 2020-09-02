const { MessageEmbed } = require('discord.js');
const algorithmia = require('algorithmia');
const sentenceBoundaryDetection = require('sbd');

module.exports = {
    name: 'wiki',
    description: 'Procura algo na wikipedia',
    aliases: ['wikipedia'], 
    category: 'Outros',
    usage: '<Palavra/Frase>',
    cooldown: 3,
    async execute(client, message, args, prefix) {
        if (!args.length) 
            return message.channel.send(`:x: Argumentos em falta, **Usa:** ${prefix}wiki <Palavra/Frase>`);

        let lang = 'pt';

        if (args[args.length-1] === 'en') {
            lang = 'en';
            args.pop();
        }

        let content = args.join(' ');

        const input = {
            'articleName': content,
            'lang': lang
        };

        const msg = await message.channel.send('<a:lab_loading:643912893011853332> A procurar...');

        await fetchContentFromWikipedia();
        if (content == args.join(' ')) return;
        sanitizeContent();
        breakContentIntoSentences();
        limitMaximumSentences();
        
        await msg.edit('', new MessageEmbed()
            .setTitle(`Wikipedia: (${args.join(' ')})`)
            .setColor('RANDOM')
            .setDescription(content.join('\n'))
            .setFooter(`${message.author.tag}`, message.author.displayAvatarURL({ dynamic: true }))
            .setTimestamp());

        async function fetchContentFromWikipedia() {   
            const algorithmiaAuthenticated = algorithmia(process.env.AlgorithmiaKey);
            const wikipediaAlgorithm = algorithmiaAuthenticated.algo('web/WikipediaParser/0.1.2?timeout=300');
            const wikipediaResponse = await wikipediaAlgorithm.pipe(input);
            try {
                const wikipediaContent = wikipediaResponse.get();
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

        function breakContentIntoSentences() {
            content = sentenceBoundaryDetection.sentences(content);
        }

        function limitMaximumSentences() {
            content = content.slice(0, 5)
        }
    }
}