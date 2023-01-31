import { User } from 'oceanic.js';
import { DefaultQueue, Track, UnresolvedTrack } from 'vulkava';

export class TrackQueue extends DefaultQueue {
  constructor() {
    super();
  }

  public peek() {
    return this.tracks[0];
  }

  public addToBeginning(track: Track | UnresolvedTrack) {
    this.tracks.unshift(track)
  }

  public areAllTracksFromUser(user: User) {
    for (const m of this.tracks) {
      if (m.requester !== user) return false;
    }
    return true;
  }

  public removeTrackAt(index: number) {
    this.tracks.splice(index, 1);
  }

  public getTrackAt(index: number) {
    return this.tracks[index];
  }

  public getSongDetails(pos: number, pos2: number) {
    const data = [];

    for (; pos < pos2 && this.tracks[pos]; pos++) {
      const req = this.tracks[pos].requester as User;
      data.push(`${pos + 1}º - \`${this.tracks[pos].title}\` (Requisitado por \`${req.username}#${req.discriminator}\`)`)
    }
    return data.join('\n');
  }
}