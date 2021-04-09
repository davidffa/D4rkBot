import { Player } from 'erela.js';

import { Filter, Timescale, Equalizer, Tremolo, Karaoke, Effect } from '../typings/index';

export default class Filters {
  private timescale?: Timescale;
  private equalizer?: Equalizer;
  private tremolo?: Tremolo;
  private karaoke?: Karaoke;

  public effects: Effect[];

  readonly player: Player;

  constructor(player: Player) {
    this.player = player;
    this.effects = [];
  }

  setFilters(filter: Filter): this {
    const packet = {
      op: 'filters',
      guildId: this.player.guild,
    }

    if (filter.timescale) {
      if (this.player.queue.current?.isStream) {
        filter.timescale.rate = 1.0;
        filter.timescale.speed = 1.0;
      }
      this.timescale = {
        pitch: filter.timescale.pitch || 1.0,
        rate: filter.timescale.rate || this.timescale?.rate || 1.0,
        speed: filter.timescale.speed || this.timescale?.speed || 1.0
      }
      Object.assign(packet, { timescale: filter.timescale });
    }

    if (filter.equalizer) {
      this.equalizer = filter.equalizer;
      for (const { band, gain } of filter.equalizer) this.player.bands[band] = gain;
      Object.assign(packet, { equalizer: filter.equalizer });
    }

    if (filter.tremolo) {
      this.tremolo = {
        depth: filter.tremolo.depth || this.tremolo?.depth || 0.5,
        frequency: filter.tremolo.frequency || this.tremolo?.frequency || 2.0
      }
      Object.assign(packet, { tremolo: filter.tremolo });
    }

    if (filter.karaoke) {
      this.karaoke = {
        level: filter.karaoke.level || this.karaoke?.level || 1.0,
        monoLevel: filter.karaoke.monoLevel || this.karaoke?.monoLevel || 1.0,
        filterBand: filter.karaoke.filterBand || this.karaoke?.filterBand || 220.0,
        filterWidth: filter.karaoke.filterWidth || this.karaoke?.filterWidth || 100.0
      }
      Object.assign(packet, { karaoke: filter.karaoke });
    }

    this.player.node.send(packet);
    return this;
  }

  addEffect(effect: Effect): this {
    this.setFilters(effects[effect]);
    this.effects.push(effect);
    return this;
  }

  removeEffect(effect: Effect): this {
    this.effects.splice(this.effects.indexOf(effect), 1);
    if (!this.effects.length) {
      this.clearFilters();
    }else {
      this.effects.forEach(eff => {
        this.setFilters(effects[eff]);
      });
    }
    
    return this;
  }

  clearFilters(): this {
    this.effects = [];
    const packet = {
      op: 'filters',
      guildId: this.player.guild,
    }

    if (this.timescale) {
      Object.assign(packet, {
        timescale: { pitch: 1.0, rate: 1.0, speed: 1.0 }
      });
      delete this.timescale;
    }

    if (this.equalizer) {
      Object.assign(packet, {
        equalizer: [
          { band: 0, gain: 0 },
          { band: 1, gain: 0 },
          { band: 2, gain: 0 },
          { band: 3, gain: 0 },
          { band: 4, gain: 0 },
          { band: 5, gain: 0 },
          { band: 6, gain: 0 },
          { band: 7, gain: 0 },
          { band: 8, gain: 0 },
          { band: 9, gain: 0 },
          { band: 10, gain: 0 },
          { band: 11, gain: 0 },
          { band: 12, gain: 0 },
          { band: 13, gain: 0 },
          { band: 14, gain: 0 }
        ]
      });
      delete this.equalizer;
    }

    if (this.tremolo) {
      Object.assign(packet, {
        tremolo: { depth: 0.5, frequency: 2.0 }
      });
      delete this.tremolo;
    }

    if (this.karaoke) {
      Object.assign(packet, {
        karaoke: { level: 1.0, monoLevel: 1.0, filterBand: 220.0, filterWidth: 100.0 }
      });
      delete this.karaoke;
    }

    this.effects = [];
    
    delete this.equalizer;
    delete this.tremolo;
    delete this.karaoke;

    this.player.node.send(packet);
    return this;
  }
}

/**
 * https://github.com/Tetracyl/EarTensifier/blob/master/config/filters.js
 */

const effects = {
  bass: {
    equalizer: [
      { band: 0, gain: 0.6 },
      { band: 1, gain: 0.67 },
      { band: 2, gain: 0.67 },
      { band: 3, gain: 0 },
      { band: 4, gain: -0.5 },
      { band: 5, gain: 0.15 },
      { band: 6, gain: -0.45 },
      { band: 7, gain: 0.23 },
      { band: 8, gain: 0.35 },
      { band: 9, gain: 0.45 },
      { band: 10, gain: 0.55 },
      { band: 11, gain: 0.6 },
      { band: 12, gain: 0.55 },
      { band: 13, gain: 0 },
    ],
  },
  pop: {
    equalizer: [
      { band: 0, gain: 0.65 },
      { band: 1, gain: 0.45 },
      { band: 2, gain: -0.45 },
      { band: 3, gain: -0.65 },
      { band: 4, gain: -0.35 },
      { band: 5, gain: 0.45 },
      { band: 6, gain: 0.55 },
      { band: 7, gain: 0.6 },
      { band: 8, gain: 0.6 },
      { band: 9, gain: 0.6 },
      { band: 10, gain: 0 },
      { band: 11, gain: 0 },
      { band: 12, gain: 0 },
      { band: 13, gain: 0 },
    ],
  },
  soft: {
    equalizer: [
      { band: 0, gain: 0 },
      { band: 1, gain: 0 },
      { band: 2, gain: 0 },
      { band: 3, gain: 0 },
      { band: 4, gain: 0 },
      { band: 5, gain: 0 },
      { band: 6, gain: 0 },
      { band: 7, gain: 0 },
      { band: 8, gain: -0.25 },
      { band: 9, gain: -0.25 },
      { band: 10, gain: -0.25 },
      { band: 11, gain: -0.25 },
      { band: 12, gain: -0.25 },
      { band: 13, gain: -0.25 },
    ],
  },
  treblebass: {
    equalizer: [
      { band: 0, gain: 0.6 },
      { band: 1, gain: 0.67 },
      { band: 2, gain: 0.67 },
      { band: 3, gain: 0 },
      { band: 4, gain: -0.5 },
      { band: 5, gain: 0.15 },
      { band: 6, gain: -0.45 },
      { band: 7, gain: 0.23 },
      { band: 8, gain: 0.35 },
      { band: 9, gain: 0.45 },
      { band: 10, gain: 0.55 },
      { band: 11, gain: 0.6 },
      { band: 12, gain: 0.55 },
      { band: 13, gain: 0 },
    ],
  },
  nightcore: {
    equalizer: [
      { band: 1, gain: 0.3 },
      { band: 0, gain: 0.3 },
    ],
    timescale: { pitch: 1.2, rate: 1.1 },
    tremolo: { depth: 0.3, frequency: 14 },
  },
  vaporwave: {
    equalizer: [
      { band: 1, gain: 0.3 },
      { band: 0, gain: 0.3 },
    ],
    timescale: { pitch: 0.5 },
    tremolo: { depth: 0.3, frequency: 14 },
  },
};
