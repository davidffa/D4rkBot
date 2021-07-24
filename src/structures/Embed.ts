import { EmbedAuthorOptions, EmbedField, EmbedFooterOptions, EmbedImageOptions } from 'eris';

export default class Embed {
  author?: EmbedAuthorOptions;
  color?: number;
  description?: string;
  fields?: EmbedField[];
  footer?: EmbedFooterOptions;
  image?: EmbedImageOptions;
  thumbnail?: EmbedImageOptions;
  timestamp?: Date | string;
  title?: string;
  url?: string;

  addField(name: string, value: string, inline = false): this {
    if (!this.fields) this.fields = [];
    this.fields.push({ name, value, inline });
    return this;
  }

  setAuthor(name: string, iconURL?: string, url?: string): this {
    this.author = {
      name,
      icon_url: iconURL,
      url
    };

    return this;
  }

  setColor(color: number | string): this {
    if (color === 'RANDOM') {
      this.color = ~~(Math.random() * (0xffffff + 1));
    } else {
      this.color = Number(color);
    }
    return this;
  }

  setDescription(description: string): this {
    this.description = description;

    return this;
  }

  setFooter(text: string, iconURL?: string): this {
    this.footer = {
      text,
      icon_url: iconURL
    }

    return this;
  }

  setImage(url: string): this {
    this.image = {
      url
    }
    return this;
  }

  setThumbnail(url: string): this {
    this.thumbnail = {
      url
    }
    return this;
  }

  setTimestamp(timestamp?: string): this {
    if (!timestamp) {
      this.timestamp = new Date();
    } else {
      this.timestamp = timestamp;
    }
    return this;
  }

  setTitle(title: string): this {
    this.title = title;
    return this;
  }

  setURL(url: string): this {
    this.url = url;
    return this;
  }
}