import Command from '../../structures/Command';
import Client from '../../structures/Client';
import CommandContext from '../../structures/CommandContext';

export default class Github extends Command {
  constructor(client: Client) {
    super(client, {
      name: 'github',
      description: 'Informações sobre algum perfil do github.',
      args: 1,
      usage: '<Nome>',
      category: 'Others',
      cooldown: 5
    });
  }

  async execute(ctx: CommandContext): Promise<void> {
    if (ctx.channel.type === 0 && !ctx.channel.permissionsOf(this.client.user.id).has('embedLinks')) {
      ctx.sendMessage({ content: ':x: Preciso da permissão `Anexar Links` para executar este comando', flags: 1 << 6 });
      return;
    }

    const res = await this.client.request(`https://api.github.com/users/${encodeURIComponent(ctx.args[0])}`);

    if (res.status !== 200) {
      ctx.sendMessage({ content: ':x: Perfil não encontrado', flags: 1 << 6 });
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

    embed.addField(':calendar: Criado em', `<t:${Math.floor(new Date(user.created_at).getTime() / 1e3)}:d> (<t:${Math.floor(new Date(user.created_at).getTime() / 1e3)}:R>)`, true);
    embed.addField(':calendar: Atualizado em', `<t:${Math.floor(new Date(user.updated_at).getTime() / 1e3)}:d> (<t:${Math.floor(new Date(user.updated_at).getTime() / 1e3)}:R>)`, true);

    user.bio && embed.addField(':bookmark_tabs: Biografia', `\n\`\`\`${user.bio}\`\`\``);

    ctx.sendMessage({ embeds: [embed] });
  }
}