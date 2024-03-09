import Command from '../../structures/Command';
import Client from '../../structures/Client';
import CommandContext from '../../structures/CommandContext';

const EMOJI_REGEX = /<(a?):.{2,32}:(\d{17,19})>/;

export default class Addemoji extends Command {
  constructor(client: Client) {
    super(client, {
      name: 'addemoji',
      description: 'Adiciona um emoji no servidor.',
      usage: '<URL/Anexo> <nome>',
      category: 'Others',
      cooldown: 4,
      args: 1
    });
  }

  async execute(ctx: CommandContext): Promise<void> {
    if (!ctx.guild) return;
    if (ctx.channel.type !== 0 || !ctx.channel.guild.members.get(this.client.user.id)?.permissions.has('MANAGE_GUILD_EXPRESSIONS')) {
      ctx.sendMessage({ content: ':x: Preciso da permissão `Gerir Emojis e Stickers` para executar este comando!', flags: 1 << 6 });
      return;
    }

    if (!ctx.member!.permissions.has('MANAGE_GUILD_EXPRESSIONS')) {
      ctx.sendMessage({ content: ':x: Precisas da permissão `Gerir Emojis e Stickers` para executar este comando!', flags: 1 << 6 })
      return;
    }

    const match = ctx.args[0].match(EMOJI_REGEX);

    if (match) {
      ctx.args[0] = `https://cdn.discordapp.com/emojis/${match[2]}${match[1] ? '.gif' : '.png'}`;
    }

    const urlRegex = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/g

    let imageURL: string;
    let emojiName: string;

    if (ctx.attachments.length) {
      imageURL = ctx.attachments[0].url;
      emojiName = ctx.args[0];
    } else {
      if (!urlRegex.test(ctx.args[0])) {
        ctx.sendMessage({ content: ':x: URL inválido!', flags: 1 << 6 });
        return;
      }
      imageURL = ctx.args[0];
      if (!ctx.args[1]) {
        ctx.sendMessage({ content: `:x: Argumentos em falta! **Usa:** \`/addemoji <URL/Anexo/Emoji> <nome>\``, flags: 1 << 6 });
        return;
      }
      emojiName = ctx.args[1];
    }

    if (emojiName.length < 2 || emojiName.length > 32) {
      ctx.sendMessage({ content: ':x: O nome do emoji tem de ter entre 2 e 32 caracteres.', flags: 1 << 6 });
      return;
    }

    const { buffer, type } = await fetch(imageURL).then(async (res) => {
      const buff = Buffer.from(await res.arrayBuffer());
      const types = res.headers.get('content-type');

      if (!types || !(/image\/png|image\/jpeg|image\/jpg|image\/gif/g.test(types))) {
        return { buffer: buff, type: null };
      }
      return { buffer: buff, type: types };
    });

    if (!type) {
      ctx.sendMessage({ content: ':x: Imagem inválida!', flags: 1 << 6 });
      return;
    }

    const base64 = `data:${type};base64,${buffer.toString('base64')}`;

    const imgWeight = ((base64.length * (3 / 4)) - (base64.endsWith('==') ? 1 : 2)) / 1024;

    if (imgWeight > 256) {
      ctx.sendMessage({ content: ':x: A imagem não pode ser maior do que 256 KB.', flags: 1 << 6 });
      return;
    }

    try {
      const res = await ctx.guild.createEmoji({
        image: base64,
        name: emojiName
      });

      ctx.sendMessage(`Emoji ${res.animated ? '<a:' : '<:'}${res.name}:${res.id}> adicionado.`);
    } catch (err: any) {
      if (err.message.includes('image: File cannot be larger than 256.0 kb')) {
        ctx.sendMessage({ content: ':x: A imagem não pode ser maior do que 256 KB.', flags: 1 << 6 });
      } else {
        ctx.sendMessage({ content: `:x: Ocorreu um erro ao enviar o emoji. Erro: \`${err.message}\``, flags: 1 << 6 });
        console.error(err);
      }
    }
  }
}
