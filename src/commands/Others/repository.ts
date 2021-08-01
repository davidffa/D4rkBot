import Command from '../../structures/Command';
import Client from '../../structures/Client';
import CommandContext from '../../structures/CommandContext';

import fetch from 'node-fetch';

export default class Repository extends Command {
  constructor(client: Client) {
      super(client, {
          name: 'repository',
          description: 'Informações sobre algum repositório do github.',
          args: 2,
          usage: '<Dono> <Nome do repositório>',
          category: 'Others',
          aliases: ['repo', 'repositorio'],
          dm: true,
          cooldown: 5
      });
  }

  async execute(ctx: CommandContext): Promise<void> {
    if (ctx.channel.type === 0 && !ctx.channel.permissionsOf(this.client.user.id).has('embedLinks')) {
      ctx.sendMessage(':x: Preciso da permissão `Anexar Links` para executar este comando');
      return;
    }
        
    const res = await fetch(`https://api.github.com/repos/${encodeURIComponent(ctx.args[0])}/${encodeURIComponent(ctx.args[1])}`);

    if (res.status !== 200) {
      ctx.sendMessage(':x: Repositório não encontrado');
      return;
    }

    const repo = await res.json();

    const embed = new this.client.embed()
      .setTitle(`<:github:784791056670654465> Repositório ${repo.name}`)
      .setColor('RANDOM')
      .addField(':id: ID', repo.id, true)
      .addField(':star: Estrelas', repo.stargazers_count, true)
      .addField('<:branch:825097749833318410> Forks', repo.forks_count, true)
      .addField('<:branch:825097749833318410> Branch principal', repo.default_branch, true)
      .addField(':eye: Observadores', repo.subscribers_count, true)
      .addField(':octagonal_sign: Issues', repo.open_issues_count, true)
      .setThumbnail(`${repo.owner.avatar_url}${Math.floor(Math.random() * 10000)}`)
      .setURL(repo.html_url)
      .setTimestamp()
      .setFooter(`${ctx.author.username}#${ctx.author.discriminator}`, ctx.author.dynamicAvatarURL());

      repo.language && embed.addField(':gear: Linguagem', repo.language, true);
      repo.license && repo.license.name && embed.addField(':newspaper: Licença', repo.license.name, true)

      embed.addField(':calendar: Criado em', `<t:${Math.floor(new Date(repo.created_at).getTime() / 1e3)}:d> (<t:${Math.floor(new Date(repo.created_at).getTime() / 1e3)}:R>)`, true);
      embed.addField(':calendar: Último push', `<t:${Math.floor(new Date(repo.pushed_at).getTime() / 1e3)}:d> (<t:${Math.floor(new Date(repo.pushed_at).getTime() / 1e3)}:R>)`, true);

      repo.description && embed.addField(':bookmark_tabs: Descrição', `\`\`\`\n${repo.description}\`\`\``);

    ctx.sendMessage({ embed });
  }
}
