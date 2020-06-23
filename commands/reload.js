module.exports = {
    name: 'reload',
    description: 'Re-carrega um comando',
    usage: '<comando para re-carregar>',
    category: 'Desenvolvedor',
    cooldown: 1,
    execute(client, message, args) {
        if (message.author.id !== '334054158879686657') {
            return message.reply(':x: Não tens permissão!');
        }

        if (!args.length) return message.channel.send(`:x: Argumentos em falta! Qual o comando para re-carregar?`);
        const commandName = args[0].toLowerCase();
        const command = client.commands.get(commandName)
            || client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));

        if (!command) return message.channel.send(`:x: Não existe nenhum comando \`${commandName}\`!`);
        
        delete require.cache[require.resolve(`./${command.name}.js`)];

        try {
            const newCommand = require(`./${command.name}.js`);
            client.commands.set(newCommand.name, newCommand);
        } catch (err) {
            console.error(err);
            message.channel.send(`:x: Erro ao re-carregar o comando \`${command.name}\`: \n\`${error.message}\``);
        }

        message.channel.send(`<a:lab_verificado:643912897218740224> Comando \`${command.name}\` re-carregado com sucesso! `);
    },
};