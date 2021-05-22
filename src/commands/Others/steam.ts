import Command from '../../structures/Command';
import Client from '../../structures/Client';
import CommandContext from '../../structures/CommandContext';

const steam = require('steam-provider');
const provider = new steam.SteamProvider();

export default class Steam extends Command {
  constructor(client: Client) {
    super(client, {
      name: 'steam',
      description: 'Informações sobre um jogo da steam.',
      args: 1,
      aliases: ['steamgame'],
      usage: '<Jogo>',
      category: 'Others',
      dm: true,
      cooldown: 5
    });
  }

  async execute(ctx: CommandContext): Promise<void> {
    if (ctx.channel.type === 0 && !ctx.channel.permissionsOf(this.client.user.id).has('embedLinks')) {
      ctx.sendMessage(':x: Preciso da permissão `Anexar Links` para executar este comando');
      return;
    }

    const res = await provider.search(ctx.args.join(' '), 1, 'portuguese', 'pt');

    if (!res.length) {
      ctx.sendMessage(':x: Jogo não encontrado');
      return;
    }

    const data = await provider.detail(res[0].id, 'portuguese', 'pt');

    const embed = new this.client.embed()
      .setColor('RANDOM')
      .setTitle('Loja Steam')
      .setDescription(`**${data.name}**`)
      .addField('ID', `\`${data.id}\``, true)
      .addField('Genero', `\`${data.genres.join(', ')}\``, true)
      .addField('Preço', `Preço normal: **${data.priceData.initialPrice}€**\n Preço de desconto: **${data.priceData.finalPrice}€**\n Desconto: **${data.priceData.discountPercent}%**`, true)
      .addField('Plataformas', `\`${data.otherData.platforms.join(', ')}\``, true)
      .addField('Tags', `\`${data.otherData.features.join(', ')}\``, true)
      .addField('Pontuação', `\`${data.otherData.metacriticScore || 0}\``, true)
      .addField('Desenvolvedor(es)', `\`${data.otherData.developer.join(', ')}\``, true)
      .addField('Publicador(es)', `\`${data.otherData.publisher.join(', ')}\``, true)
      .setImage(data.otherData.imageUrl)
      .setTimestamp()
      .setFooter(`${ctx.author.username}#${ctx.author.discriminator}`, ctx.author.dynamicAvatarURL());

    ctx.sendMessage({ embed });
  }
}