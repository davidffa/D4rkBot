require('dotenv').config();
const { readdirSync } = require('fs');
const { Client, Collection } = require('discord.js');
const { connect } = require('mongoose');

const client = new Client();
client.commands = new Collection();

connect(process.env.MONGODBURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

//Command Handler
readdirSync('./src/commands').forEach(dir => {
    if (dir.endsWith('.js')) {
        const cmd = require(`./commands/${dir}`);
        client.commands.set(cmd.name, cmd);
    }else {
        readdirSync(`./src/commands/${dir}`).forEach(file => {
            const command = require(`./commands/${dir}/${file}`);
            client.commands.set(command.name, command);
        })
    }
});

//Event Handler
const eventFiles = readdirSync('./src/events').filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
    const event = require(`./events/${file}`);
    const eventName = file.split('.')[0];
    client.on(eventName, (...args) => event.run(client, ...args));
}

client.login(process.env.TOKEN);