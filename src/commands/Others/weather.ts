import Command from '../../structures/Command';
import Client from '../../structures/Client';
import Embed from '../../structures/Embed';

import { Message } from 'eris';

import fetch from 'node-fetch';

import xml2js from 'xml2js';

interface WeatherInfo {
    imageURL: string;
    lat: string;
    long: string;
    timezone: string;
    temp: string;
    feelsLike: string;
    observationTime: string;
    observationPoint: string;
    humidity: string;
    day: string;
    wind: string;
    skyText: string;
}

class Weather extends Command {
    constructor(client: Client) {
        super(client, {
            name: 'weather',
            description: 'Obtém dados sobre a meteorologia atual numa cidade',
            args: 1,
            usage: '<cidade>',
            category: 'Others',
            dm: true,
            aliases: ['clima', 'meteorologia'],
            cooldown: 5
        });
    }

    async execute(message: Message, args: Array<string>): Promise<void> {
        if (message.channel.type === 0 && !message.channel.permissionsOf(this.client.user.id).has('embedLinks')) {
            message.channel.createMessage(':x: Preciso da permissão `EMBED_LINKS` para executar este comando');
            return;
        }
        
        const xmlParser = new xml2js.Parser({ charkey: 'C$', attrkey: 'A$', explicitArray: true });

        const res = await fetch(`http://weather.service.msn.com/find.aspx?src=outlook&weadegreetype=C&culture=pt-PT&weasearchstr=${args.join(' ')}`).then(res => res.text());

        if (!res) {
            message.channel.createMessage(':x: Ocorreu um erro ao obter os dados meteorológicos');
            return;
        }

        let weather: WeatherInfo|null|undefined;

        xmlParser.parseString(res, (err: string, json: any): void => {
            if (err || !json || !json.weatherdata || !json.weatherdata.weather) {
                weather = null;
                return;
            }

            const data = json.weatherdata.weather[0]['A$'];
            const weatherData = json.weatherdata.weather[0].current[0]['A$'];

            weather = { 
                imageURL: `${data.imagerelativeurl}/law/${weatherData.skycode}.gif`,
                lat: data.lat,
                long: data.long,
                timezone: data.timezone >= 0 ? `UTC+${data.timezone}` : `UTC${data.timezone}`,
                temp: weatherData.temperature,
                feelsLike: weatherData.feelslike,
                observationTime: weatherData.observationtime,
                observationPoint: weatherData.observationpoint,
                humidity: weatherData.humidity,
                day: weatherData.day,
                wind: weatherData.winddisplay,
                skyText: weatherData.skytext
            }
        });

        if (!weather) {
            message.channel.createMessage(':x: Cidade não encontrada!');
            return;
        }

        const embed = new Embed()
            .setColor('RANDOM')
            .setTitle(`Meteorologia para ${weather.observationPoint}, ${weather.day}`)
            .setDescription(weather.skyText)
            .addField(':alarm_clock: Fuso Horário:', `\`${weather.timezone}\``, true)
            .addField(':thermometer: Temperatura:', `\`${weather.temp}ºC\``, true)
            .addField(':thermometer: Sensação Térmica:', `\`${weather.feelsLike}ºC\``, true)
            .addField(':wind_blowing_face: Vento:', `\`${weather.wind}\``, true)
            .addField(':sweat_drops: Humidade:', `\`${weather.humidity}%\``, true)
            .addField(':clock: Hora de observação:', `\`${weather.observationTime}\` (Hora local)`, true)
            .addField(':map: Coordenadas', `Latitude: \`${weather.lat}\`\nLongitude: \`${weather.long}\``, true)
            .setThumbnail(weather.imageURL)
            .setTimestamp()
            .setFooter(`${message.author.username}#${message.author.discriminator}`, message.author.dynamicAvatarURL());
    
        message.channel.createMessage({ embed });
    }
}

module.exports = Weather;