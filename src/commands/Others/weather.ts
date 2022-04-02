import Command from '../../structures/Command';
import Client from '../../structures/Client';
import CommandContext from '../../structures/CommandContext';

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

export default class Weather extends Command {
  constructor(client: Client) {
    super(client, {
      name: 'weather',
      description: 'Obtém dados sobre a meteorologia atual numa cidade.',
      args: 1,
      usage: '<cidade>',
      category: 'Others',
      aliases: ['clima', 'meteorologia'],
      cooldown: 5
    });
  }

  async execute(ctx: CommandContext): Promise<void> {
    if (ctx.channel.type === 0 && !ctx.channel.permissionsOf(this.client.user.id).has('embedLinks')) {
      ctx.sendMessage({ content: ':x: Preciso da permissão `Anexar Links` para executar este comando', flags: 1 << 6 });
      return;
    }

    const xmlParser = new xml2js.Parser({ charkey: 'C$', attrkey: 'A$', explicitArray: true });

    const res = await this.client.request(`http://weather.service.msn.com/find.aspx?src=outlook&weadegreetype=C&culture=pt-PT&weasearchstr=${ctx.args.join(' ')}`).then(res => res.body.text());

    if (!res) {
      ctx.sendMessage({ content: ':x: Ocorreu um erro ao obter os dados meteorológicos', flags: 1 << 6 });
      return;
    }

    let weather: WeatherInfo | null | undefined;

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
      ctx.sendMessage({ content: ':x: Cidade não encontrada!', flags: 1 << 6 });
      return;
    }

    const embed = new this.client.embed()
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
      .setFooter(`${ctx.author.username}#${ctx.author.discriminator}`, ctx.author.dynamicAvatarURL());

    ctx.sendMessage({ embeds: [embed] });
  }
}