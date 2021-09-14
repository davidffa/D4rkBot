import Command from '../structures/Command';
import Client from '../structures/Client';
import CommandContext from '../structures/CommandContext';
import { ComponentCollector } from '../structures/Collector';

import { ActionRow, ComponentInteraction, Message } from 'eris';

export default class Help extends Command {
  constructor(client: Client) {
    super(client, {
      name: 'help',
      description: 'Lista de todos os comandos ou informações de um comando específico.',
      aliases: ['comandos', 'cmd', 'cmds', 'ajuda', 'ajd', 'cmdlist', 'commandlist'],
      cooldown: 5,
    })
  }

  async execute(ctx: CommandContext): Promise<void> {
    if (ctx.channel.type === 0 && !ctx.channel.permissionsOf(this.client.user.id).has('embedLinks')) {
      ctx.sendMessage({ content: ':x: Preciso da permissão `Anexar Links` para executar este comando', flags: 1 << 6 });
      return;
    }

    const Mod: Array<string> = [];
    const Settings: Array<string> = [];
    const Dev: Array<string> = [];
    const Info: Array<string> = [];
    const Music: Array<string> = [];
    const Others: Array<string> = [];

    const commands = this.client.commands;

    const embed = new this.client.embed()
      .setColor('RANDOM')
      .setTitle('Ajuda')
      .setFooter(`${ctx.author.username}#${ctx.author.discriminator}`, ctx.author.dynamicAvatarURL())
      .setTimestamp();

    if (!ctx.args.length) {
      embed.setDescription(`Lista de todos os meus comandos [${ctx.author.id === '334054158879686657' ? this.client.commands.length : this.client.commands.length - 3}]:`);
      commands.forEach(cmd => {
        switch (cmd.category) {
          case 'Moderation':
            Mod.push(cmd.name);
            break;
          case 'Settings':
            Settings.push(cmd.name);
            break;
          case 'Dev':
            ctx.author.id === '334054158879686657' && Dev.push(cmd.name);
            break;
          case 'Info':
            Info.push(cmd.name);
            break;
          case 'Music':
            Music.push(cmd.name);
            break;
          case 'Others':
            Others.push(cmd.name);
            break;
          default:
            Others.push(cmd.name);
            break;
        }
      });

      embed.addField(`> :cop: Moderação [${Mod.length}]`, `\`\`\`${Mod.join(' | ')}\`\`\``)
        .addField(`> :gear: Definições [${Settings.length}]`, `\`\`\`${Settings.join(' | ')}\`\`\``);

      ctx.author.id === '334054158879686657' && embed.addField(`> <:lang_js:803678540528615424> Desenvolvedor [${Dev.length}]`, `\`\`\`${Dev.join(' | ')}\`\`\``);

      embed.addField(`> :information_source: Informação [${Info.length}]`, `\`\`\`${Info.join(' | ')}\`\`\``)
        .addField(`> <a:disco:803678643661832233> Musica [${Music.length}]`, `\`\`\`${Music.join(' | ')}\`\`\``)
        .addField(`> :books: Outros [${Others.length}]`, `\`\`\`${Others.join(' | ')}\`\`\``)
        .addField(`:thinking: Mais ajuda`, `Faz \`${this.client.guildCache.get(ctx.guild.id)?.prefix || 'db.'}help <nome do comando>\` para obter informação sobre um comando`)
        .addField(`<:megathink:803675654376652880> Ainda mais ajuda`, '[Servidor de Suporte](https://discord.gg/dBQnxVCTEw)')

      const row: ActionRow = {
        type: 1,
        components: [
          {
            custom_id: 'delete',
            style: 4,
            type: 2,
            emoji: {
              name: '🗑️'
            }
          }
        ]
      }

      const msg = await ctx.sendMessage({ embeds: [embed], components: [row] }, true) as Message;

      const filter = (i: ComponentInteraction) => i.member!.id === ctx.author.id;

      const collector = new ComponentCollector(this.client, msg, filter, { time: 5 * 60 * 1000 });

      collector.on('collect', () => {
        msg.delete();
      });

      collector.on('end', () => {
        msg.edit({ components: [] });
      });

      return;
    }

    const name = ctx.args[0].toLowerCase();
    const cmd = commands.filter(c => ctx.author.id === '334054158879686657' || c.category !== 'Dev').find(c => c.name === name || c.aliases?.includes(name));

    if (!cmd) {
      embed.setTitle('Comando não encontrado')
      embed.setDescription(`:x: Não tenho nenhum comando com o nome \`${name}\``);
      ctx.sendMessage({ embeds: [embed] });
      return;
    }

    const data = [];

    data.push(`**Nome:** ${cmd.name}`);
    data.push(`**Descriçao:** ${cmd.description}`);
    cmd.aliases && data.push(`**Alternativas:** ${cmd.aliases.join(', ')}`);
    cmd.usage && data.push(`**Uso:** ${this.client.guildCache.get(ctx.guild?.id as string)?.prefix || 'db.'}${cmd.name} ${cmd.usage}`);

    data.push(`**Cooldown:** ${cmd.cooldown || 3} segundo(s)`);

    embed.setTitle(`Ajuda do comando ${ctx.args[0]}`)
    embed.setDescription(data.join('\n'))
    ctx.sendMessage({ embeds: [embed] });
  }
}