import Command from '../../structures/Command';
import Client from '../../structures/Client';
import CommandContext from '../../structures/CommandContext';

import Logger from '../../utils/Logger';
import { dynamicAvatar } from '../../utils/dynamicAvatar';

interface FindResponse {
  cod: string | number;
  message: string;
  list: Array<{
    id: string;
    name: string;
    coord: {
      lat: number;
      lon: number;
    }
  }>;
}

interface WeatherInfo {
  dt: number;
  sunrise?: number;
  sunset?: number;
  temp: number;
  feels_like: number;
  pressure: number;
  humidity: number;
  uvi: number;
  clouds: number;
  visibility: number;
  wind_speed: number;
  wind_deg: number;
  wind_gust: number;
  weather: Array<{
    description: string;
    icon: string;
  }>;
}

interface WeatherResponse {
  timezone_offset: number;
  current: WeatherInfo;
}

const BASE_URL = 'https://openweathermap.org';
const SCRIPT_REGEX = /<script src="(.+\/find.js)"/;
const APP_ID_REGEX = /appid=([a-z0-9]+)/;

let appId = "";

export default class Weather extends Command {
  private readonly log: Logger;

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

    this.log = Logger.getLogger(this.constructor.name);
  }

  async execute(ctx: CommandContext): Promise<void> {
    if (ctx.channel.type === 0 && !ctx.channel.permissionsOf(this.client.user.id).has('EMBED_LINKS')) {
      ctx.sendMessage({ content: ':x: Preciso da permissão `Anexar Links` para executar este comando', flags: 1 << 6 });
      return;
    }

    if (appId === "") {
      await ctx.defer();
      try {
        await Weather.fetchAppId();
      } catch (e: any) {
        ctx.sendMessage({ content: `:x: Ocorreu um erro ao obter a meteorologia!`, flags: 1 << 6 });
        this.log.error(e?.message);
        return;
      }
    }

    let find: FindResponse = await fetch(`${BASE_URL}/data/2.5/find?q=${encodeURIComponent(ctx.args.join(' '))}&units=metric&appid=${appId}`).then(r => r.json());
    if (find.cod != '200') {
      if (find.cod == '401') {
        await ctx.defer();
        await Weather.fetchAppId();
        find = await fetch(`${BASE_URL}/data/2.5/find?q=${encodeURIComponent(ctx.args.join(' '))}&units=metric&appid=${appId}`).then(r => r.json());

        if (find.cod != '200') {
          ctx.sendMessage({ content: `:x: Ocorreu um erro ao obter a meteorologia!`, flags: 1 << 6 });
          this.log.error(`Weather find error ${find.cod}: ${find.message}`);
          return;
        }
      }

      ctx.sendMessage({ content: `:x: Ocorreu um erro ao obter a meteorologia!`, flags: 1 << 6 });
      this.log.error(`Weather find error ${find.cod}: ${find.message}`);
      return;
    }

    if (!find.list.length) {
      ctx.sendMessage({ content: `:x: Cidade não encontrada! Tenta \`Nome da cidade, código do país\` exemplo: \`Lisboa, PT\``, flags: 1 << 6 });
      return;
    }

    const { current, timezone_offset }: WeatherResponse = await fetch(`${BASE_URL}/data/2.5/onecall?lang=pt&lat=${find.list[0].coord.lat}&lon=${find.list[0].coord.lon}&units=metric&appid=${appId}`).then(r => r.json());

    if (!current) {
      ctx.sendMessage({ content: ':x: Ocorreu um erro ao obter a meterologia!', flags: 1 << 6 });
      return;
    }

    const tz = timezone_offset / 3600;

    const embed = new this.client.embed()
      .setColor('RANDOM')
      .setTitle(`Meteorologia para ${find.list[0].name}, <t:${current.dt}:F>`)
      .addField(':alarm_clock: Fuso Horário:', `\`UTC${tz >= 0 ? '+' : ''}${tz}\``, true)
      .addField(':thermometer: Temperatura:', `\`${current.temp.toFixed(0)}ºC\``, true)
      .addField(':thermometer: Sensação Térmica:', `\`${current.feels_like.toFixed(0)}ºC\``, true)
      .addField(':beach_umbrella: Índice UV:', `\`${Weather.getUVState(~~current.uvi)}\`, \`${current.uvi.toFixed(0)}\``, true)
      .addField(':sweat_drops: Humidade:', `\`${current.humidity}%\``, true)
      .addField(':earth_africa: Pressão', `\`${current.pressure} hPa\``, true)
      .addField(':cloud: Nuvens:', `\`${current.clouds}%\``, true)
      .addField(':railway_track: Visibilidade:', `\`${(current.visibility / 1000).toFixed(1)} km\``, true)
      .setThumbnail(`https://openweathermap.org/img/wn/${current.weather[0].icon}@2x.png`)
      .setTimestamp()
      .setFooter(`${ctx.author.username}#${ctx.author.discriminator}`, dynamicAvatar(ctx.author));

    if (current.sunrise && current.sunset) {
      const my_tz_offset = new Date().getTimezoneOffset() * 60;
      const sunrise = new Date((current.sunrise + timezone_offset + my_tz_offset) * 1000);
      const sunset = new Date((current.sunset + timezone_offset + my_tz_offset) * 1000);

      const sunriseH = sunrise.getHours().toString().padStart(2, '0');
      const sunriseM = sunrise.getMinutes().toString().padStart(2, '0');
      const sunsetH = sunset.getHours().toString().padStart(2, '0');
      const sunsetM = sunset.getMinutes().toString().padStart(2, '0');

      embed.addField(':sunny: Sol:', `${sunriseH}:${sunriseM}-${sunsetH}:${sunsetM}`, true);
    }

    embed.addField(':map: Coordenadas', `Latitude: \`${find.list[0].coord.lat}\`\nLongitude: \`${find.list[0].coord.lon}\``, true)
      .addField(':wind_blowing_face: Vento:', `\`${current.wind_speed} m/s ${Weather.windDegToDirection(current.wind_deg)}\``, true);

    ctx.sendMessage({ embeds: [embed] });
  }

  static getUVState(uv: number): string {
    if (uv <= 2) return 'Baixo';
    else if (uv <= 5) return 'Moderado';
    else if (uv <= 7) return 'Alto';
    else if (uv <= 10) return 'Muito alto';
    else return 'Extremo';
  }

  static windDegToDirection(deg: number): string {
    const directions = [
      'Norte',
      'Norte-Nordeste',
      'Nordeste',
      'Este-Nordeste',
      'Este',
      'Este-Sudeste',
      'Sudeste',
      'Sul-Sudeste',
      'Sul',
      'Sul-Sudoeste',
      'Sudoeste',
      'Oeste-Sudoeste',
      'Oeste',
      'Oeste-Noroeste',
      'Noroeste',
      'Norte-Noroeste'
    ];

    return directions[Math.round((directions.length / 360) * ((deg + 180) / 2 + 11.25))];
  }

  static async fetchAppId(): Promise<void> {
    const html = await fetch(`${BASE_URL}/find`).then(r => r.text());
    const htmlMatch = html.match(SCRIPT_REGEX);
    if (htmlMatch === null) {
      throw new Error('Could not find the find script');
    }

    const script = await fetch(`${BASE_URL}${htmlMatch[1]}`).then(r => r.text());
    const findAppIdMatch = script.match(APP_ID_REGEX);

    if (findAppIdMatch === null) {
      throw new Error('Could not find the find app id');
    }

    appId = findAppIdMatch[1];
  }
}
