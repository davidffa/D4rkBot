const weather = require('weather-js');
const { MessageEmbed } = require('discord.js');

module.exports = {
    name: 'clima',
    description: 'Fornece dados sobre a meteorologia atual numa cidade',
    aliases: ['meteorologia'], 
    category: 'Outros',
    usage: '<cidade>',
    args: 1,
    cooldown: 5,
    execute(client, message, args) {
        weather.find({ lang: 'pt-PT', search: args.join(' '), degreeType: 'C' }, (err, result) => {
            if (err) 
                return message.channel.send(':x: Ocorreu um erro!');
            
            if (!result[0]) 
                return message.channel.send(':x: Cidade inválida!');
            
            const data = result[0].current;
            const timezone = result[0].location.timezone >= 0 ? `UTC+${result[0].location.timezone}` : `UTC${result[0].location.timezone}`;

            const embed = new MessageEmbed()
                .setColor('RANDOM')
                .setTitle(`Meteorologia para ${data.observationpoint}, ${data.day}`)
                .setDescription(data.skytext)
                .addField(':alarm_clock: Fuso Horário:', `\`${timezone}\``, true)
                .addField(':thermometer: Temperatura:', `\`${data.temperature}ºC\``, true)
                .addField(':thermometer: Sensação Térmica:', `\`${data.feelslike}ºC\``, true)
                .addField(':wind_blowing_face: Vento:', `\`${data.winddisplay}\``, true)
                .addField(':sweat_drops: Humidade:', `\`${data.humidity}%\``, true)
                .addField(':clock: Hora de observação:', `\`${data.observationtime}\` (Hora local)`, true)
                .setThumbnail(data.imageUrl)
                .setTimestamp()
                .setFooter(message.author.tag, message.author.displayAvatarURL({ dynamic: true }));

            message.channel.send(embed);
        }); 
    }
}