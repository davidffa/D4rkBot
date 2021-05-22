import Command from '../../structures/Command';
import Client from '../../structures/Client';
import CommandContext from '../../structures/CommandContext';

import fetch from 'node-fetch';

import moment from 'moment';
moment.locale('pt');

export default class Github extends Command {
  constructor(client: Client) {
    super(client, {
      name: 'github',
      description: 'Informações sobre algum perfil do github.',
      args: 1,
      usage: '<Nome>',
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

    const res = await fetch(`https://api.github.com/users/${ctx.args[0]}`);

    if (res.status !== 200) {
      ctx.sendMessage(':x: Perfil não encontrado');
      return;
    }

    const user = await res.json();

    const embed = new this.client.embed()
      .setTitle(`<:github:784791056670654465> Perfil de ${user.login}`)
      .setColor('RANDOM')
      .addField(':bust_in_silhouette: Nome', user.name || user.login, true)
      .addField(':id: ID', user.id, true)
      .addField(':bookmark: Repositórios Públicos', user.public_repos, true)
      .addField('<:followers:784795303156908032> Seguidores', user.followers, true)
      .addField(':busts_in_silhouette: A seguir', user.following, true)
      .setThumbnail(`${user.avatar_url}${Math.floor(Math.random() * 10000)}`)
      .setURL(user.html_url)
      .setTimestamp()
      .setFooter(`${ctx.author.username}#${ctx.author.discriminator}`, ctx.author.dynamicAvatarURL());

    user.email && embed.addField(':e_mail: Email', user.email, true);
    user.company && embed.addField(':classical_building: Empresa', user.company, true);
    user.twitter_username && embed.addField('<:twitter:785165170547753002> Twitter', `[@${user.twitter_username}](https://twitter.com/${user.twitter_username})`, true);
    user.location && embed.addField(':map: Localização', user.location, true);

    embed.addField(':calendar: Criado em', `${moment(user.created_at).format('L')} (${moment(user.created_at).startOf('day').fromNow()})`, true);
    embed.addField(':calendar: Atualizado em', `${moment(user.updated_at).format('L')} (${moment(user.updated_at).startOf('day').fromNow()})`, true);

    user.bio && embed.addField(':bookmark_tabs: Biografia', `\n\`\`\`${user.bio}\`\`\``);

    ctx.sendMessage({ embed });
  }
}