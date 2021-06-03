import Command from '../../structures/Command';
import Client from '../../structures/Client';
import CommandContext from '../../structures/CommandContext';

export default class Invite extends Command {
  constructor(client: Client) {
    super(client, {
      name: 'invite',
      description: 'Envia o link do meu convite.',
      aliases: ['inv', 'convite'],
      category: 'Info',
      cooldown: 3,
      dm: true
    });
  }

  execute(ctx: CommandContext): void {
    const embedRes = [
      '<a:blobdance:804026401849475094> **Adicione-me ao seu servidor usando um dos convites abaixo**\n',
      '[Com permissão de administrador](https://discord.com/oauth2/authorize?client_id=499901597762060288&scope=bot+applications.commands&permissions=8)',
      '[Com todas as permissões necessárias](https://discord.com/oauth2/authorize?client_id=499901597762060288&scope=bot+applications.commands&permissions=1345711190)',
      '[Sem permissões](https://discord.com/oauth2/authorize?client_id=499901597762060288&scope=bot+applications.commands&permissions=0)',
      '[Sem slash commands](https://discord.com/oauth2/authorize?client_id=499901597762060288&scope=bot&permissions=0)\n',
      '[Servidor de Suporte](https://discord.gg/dBQnxVCTEw)'
    ];

    const res = [
      '<a:blobdance:804026401849475094> **Adicione-me ao seu servidor usando um dos convites abaixo**\n',
      'Com permissão de administrador -> https://discord.com/oauth2/authorize?client_id=499901597762060288&scope=bot+applications.commands&permissions=8',
      'Com todas as permissões necessárias -> https://discord.com/oauth2/authorize?client_id=499901597762060288&scope=bot+applications.commands&permissions=1345711190',
      'Sem permissões -> https://discord.com/oauth2/authorize?client_id=499901597762060288&scope=bot+applications.commands&permissions=0',
      'Sem slash commands -> https://discord.com/oauth2/authorize?client_id=499901597762060288&scope=bot&permissions=0\n\n',
      'Servidor de Suporte -> https://discord.gg/dBQnxVCTEw'
    ]

    const embed = new this.client.embed()
      .setColor('RANDOM')
      .setTitle('Convite')
      .setDescription(embedRes.join('\n'))
      .setFooter(`${ctx.author.username}#${ctx.author.discriminator}`, ctx.author.dynamicAvatarURL())
      .setTimestamp();

    if (ctx.channel.type === 0 && !ctx.channel.permissionsOf(this.client.user.id).has('embedLinks')) {
      ctx.sendMessage(res.join('\n'))
    } else {
      ctx.sendMessage({ embed });
    }
  }
}