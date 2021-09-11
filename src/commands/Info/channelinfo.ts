import Command from '../../structures/Command';
import Client from '../../structures/Client';
import CommandContext from '../../structures/CommandContext';

export default class Channelinfo extends Command {
  constructor(client: Client) {
    super(client, {
      name: 'channelinfo',
      description: 'Mostra informações sobre um canal do servidor.',
      category: 'Info',
      aliases: ['chinfo'],
      usage: '[ID do canal/Nome]',
      cooldown: 4
    });
  }

  async execute(ctx: CommandContext): Promise<void> {
    if (!ctx.guild) return;
    if (ctx.channel.type !== 0 || !ctx.channel.permissionsOf(this.client.user.id).has('embedLinks')) {
      ctx.sendMessage({ content: ':x: Preciso da permissão `Anexar Links` para executar este comando.', flags: 1 << 6 });
      return;
    }

    const channel = ctx.args.length ? (ctx.guild.channels.get(ctx.args[0])
      || ctx.guild.channels.find(ch => ch.name.includes(ctx.args.join(' ')))) : ctx.channel;

    if (!channel) {
      ctx.sendMessage({ content: ':x: Canal não encontrado!', flags: 1 << 6 });
      return;
    }

    const channelTypes = {
      0: 'Texto',
      2: 'Voz',
      4: 'Categoria',
      5: 'Anúncios',
      6: 'Loja',
      13: 'Palco'
    }

    const embed = new this.client.embed()
      .setTitle('Channel Info')
      .setColor('RANDOM')
      .addField(':id: ID', `\`${channel.id}\``, true)
      .addField(':newspaper: Nome', `\`${channel.name}\``, true)
      .addField(':diamond_shape_with_a_dot_inside: Tipo', `\`${channelTypes[channel.type]}\``, true)
      .addField(':underage: NSFW', `\`${channel.nsfw ? 'Sim' : 'Não'}\``, true)
      .addField(':trophy: Posição', `\`${channel.position}\``, true)
      .setFooter(`${ctx.author.username}#${ctx.author.discriminator}`, ctx.author.dynamicAvatarURL())
      .setTimestamp();

    if (channel.type === 2 || channel.type === 13) {
      const regions: any = {
        'brazil': ':flag_br:',
        'europe': ':flag_eu:',
        'hong-kong': ':flag_hk:',
        'japan': ':flag_jp:',
        'india': ':flag_in:',
        'russia': ':flag_ru:',
        'singapore': ':flag_sg:',
        'sydney': ':flag_au:',
        'us-south': ':flag_us:',
        'us-east': ':flag_us:',
        'us-central': ':flag_us:',
        'us-west': ':flag_us:',
        'southafrica': ':flag_za:',
      }
      embed.addField(':notes: Taxa de bits', `\`${channel.bitrate}\``, true);
      embed.addField(':map: Região', `${channel.rtcRegion ? regions[channel.rtcRegion] : '`Auto`'}`, true);
      embed.addField(':movie_camera: Vídeo', `\`${channel.videoQualityMode === 2 ? '720p' : 'Auto'}\``, true);
    }

    channel.parentID && embed.addField(':flag_white: Categoria', `\`${ctx.guild.channels.get(channel.parentID)?.name}\``, true);

    if (channel.type === 0 || channel.type === 5) {
      embed.addField(':question: Tópico', `\`\`\`${channel.topic ? channel.topic : 'Nenhum'}\`\`\``, true);
    }
    ctx.sendMessage({ embeds: [embed] });
  }
}