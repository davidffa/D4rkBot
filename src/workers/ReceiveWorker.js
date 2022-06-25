/*
 *  Copyright 2022 David Amorim
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 * 
 */

const { parentPort } = require('worker_threads');
const { spawn } = require('child_process');
const { Readable } = require('stream');
const { createWriteStream, existsSync, mkdirSync } = require('fs');

/**
 * data structure
 * {
 *  guildID?: string,
 *  op: number - operation (0: stop, 1: start, 2: queue voice packet)
 *  bitrate?: number, - the voice channel bitrate (only for op: 1)
 *  userID?: string, - used to queue voice packet
 *  packet?: Buffer, - voice packet to queue
 * }
 */

let interval;
let FFMPEG;

const voiceMap = new Map();

const readable = new Readable();
readable._read = () => { };

function processVoiceSample() {
  // ((sample_rate/1000) * frame_duration) * channel_count * 2 (16 bit, so 2 bytes per sample)
  // (48000 / 1000 * 20) * 2 * 2 = 3840
  const finalPacket = Buffer.allocUnsafe(3840);

  if (voiceMap.size) {
    for (var i = 0; i < 3840; i += 2) {
      let sample = 0;

      for (const voiceQueue of voiceMap.values()) {
        sample += voiceQueue[0].readInt16LE(i);
      }

      // Clamp the sample value to 16 bit integer range
      if (sample > 32767) sample = 32767;
      else if (sample < -32768) sample = -32768;

      finalPacket.writeInt16LE(sample, i);
    }

    for (const [userID, voiceQueue] of voiceMap.entries()) {
      voiceQueue.shift();
      if (!voiceQueue[0]) voiceMap.delete(userID);
    }
  } else { // no voice packets, fill buffer with silence
    finalPacket.fill(0);
  }

  readable.push(finalPacket);
}

parentPort.on('message', (data) => {
  const { guildID, op, userID, packet } = data;

  if (op === 2) {
    // console.log('Queueing voice packet', packet)
    if (voiceMap.has(userID)) voiceMap.get(userID).push(Buffer.from(packet));
    else voiceMap.set(userID, [Buffer.from(packet)]);
  } else if (op === 0) {
    clearInterval(interval);

    // Flush the voice map
    while (voiceMap.size) {
      // console.log("Flushing the voice map");
      processVoiceSample();
    }

    readable.unpipe(FFMPEG.stdin);
    FFMPEG.kill();

    // reply to main thread
    parentPort.postMessage({
      guildID,
      done: true,
    });
  } else if (op === 1) {
    // let intensive work begin!!!
    interval = setInterval(() => {
      processVoiceSample();
    }, 20); // oh yeah 20ms audio packets

    const bitrate = Math.min(180000, data.bitrate);

    FFMPEG = spawn('ffmpeg', ['-f', 's16le', '-ar', '48k', '-ac', '2', '-i', 'pipe:0', '-b:a', bitrate.toString(), '-f', 'mp3', 'pipe:1'], { stdio: ['pipe', 'pipe', 'ignore'] });
    readable.pipe(FFMPEG.stdin);

    // FFMPEG logs (^ remove ignore stderr)
    // FFMPEG.stderr.pipe(process.stderr);

    if (!existsSync('./records')) mkdirSync('./records');
    FFMPEG.stdout.pipe(createWriteStream(`./records/record-${guildID}.mp3`));
  }
});