import Command from '../../structures/Command';
import Client from '../../structures/Client';
import CommandContext from '../../structures/CommandContext';

export default class Discriminator extends Command {
  constructor(client: Client) {
    super(client, {
      name: 'discriminator',
      description: 'Mostra todas as pessoas no servidor com um determinado discriminator.',
      category: 'Info',
      aliases: ['discrimin'],
      cooldown: 5,
      args: 1,
      usage: '<discriminator>'
    });
  }

  execute(ctx: CommandContext) {
    if (ctx.channel.type !== 0 || !ctx.guild) return;

    const discriminRegex = /^[0-9]{4}$/g;
    const discrimin = ctx.args.join('').replace('#', '');

    if (!discriminRegex.test(discrimin)) {
      ctx.sendMessage(':x: Discriminator inválido!');
      return;
    }

    const members = ctx.guild.members.filter(m => m.discriminator === discrimin).map(m => `${m.username}#${m.discriminator}`);

    if (!members.length) {
      ctx.sendMessage(':x: Não encontrei nenhum membro com esse discriminator!');
      return;
    }

    ctx.sendMessage(`<:chat:804050576647913522> Membros com o discriminator **${discrimin}**:\n\`\`\`\n${members.slice(0, 30).join('\n')}${members.length > 30 ? `\n\nMais ${members.length - 30} resultados encontrados` : ''}\`\`\``);
  }
}
