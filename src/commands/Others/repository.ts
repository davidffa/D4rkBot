import Command from '../../structures/Command';
import Client from '../../structures/Client';

import { Message } from 'eris';

import fetch from 'node-fetch';

import moment from 'moment';
moment.locale('pt');

export default class Repository extends Command {
  constructor(client: Client) {
      super(client, {
          name: 'repository',
          description: 'Informações sobre algum repositório do github',
          args: 2,
          usage: '<Dono> <Nome do repositório>',
          category: 'Others',
          aliases: ['repo', 'repositorio'],
          dm: true,
          cooldown: 5
      });
  }

  async execute(message: Message, args: Array<string>): Promise<void> {
    if (message.channel.type === 0 && !message.channel.permissionsOf(this.client.user.id).has('embedLinks')) {
      message.channel.createMessage(':x: Preciso da permissão `Anexar Links` para executar este comando');
      return;
    }
        
    const res = await fetch(`https://api.github.com/repos/${args[0]}/${args[1]}`);

    if (res.status !== 200) {
      message.channel.createMessage(':x: Repositório não encontrado');
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
      .setFooter(`${message.author.username}#${message.author.discriminator}`, message.author.dynamicAvatarURL());

      repo.language && embed.addField(':gear: Linguagem', repo.language, true);
      repo.license && repo.license.name && embed.addField(':newspaper: Licença', repo.license.name, true)

      embed.addField(':calendar: Criado em', `${moment(repo.created_at).format('L')} (${moment(repo.created_at).startOf('day').fromNow()})`, true);
      embed.addField(':calendar: Último push', `${moment(repo.pushed_at).format('L')} (${moment(repo.pushed_at).startOf('day').fromNow()})`, true);

      embed.addField(':bookmark_tabs: Descrição', `\`\`\`\n${repo.description}\`\`\``);

      message.channel.createMessage({ embed });
    }
}