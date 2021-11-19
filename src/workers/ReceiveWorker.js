const { parentPort } = require('worker_threads');
const { spawn } = require('child_process');
const { Readable } = require('stream');
const { createWriteStream, existsSync, mkdirSync } = require('fs');

/**
 * data structure
 * {
 *  guildID?: string,
 *  op: number - operation (0: stop, 1: start, 2: queue voice packet)
 *  userID?: string, - used to queue voice packet
 *  packet?: Buffer, - voice packet to queue
 * }
 */

let interval;
let FFMPEG;

const voiceMap = new Map();

const readable = new Readable();
readable._read = () => { };

parentPort.on('message', (data) => {
  const { guildID, op, userID, packet } = data;

  if (op === 2) {
    // console.log('Queueing voice packet', packet)
    if (voiceMap.has(userID)) voiceMap.get(userID).push(Buffer.from(packet));
    else voiceMap.set(userID, [Buffer.from(packet)]);
  } else if (op === 0) {
    clearInterval(interval);
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
      const finalPacket = Buffer.allocUnsafe(3840); // (48k 16 bit little endian pcm, 2 stereo channels)

      if (voiceMap.size) {
        for (var i = 0; i < 3840; i += 2) {
          let sample = 0;

          for (const voiceQueue of voiceMap.values()) {
            sample += voiceQueue[0].readInt16LE(i);
          }

          sample = Math.max(-32767, Math.min(32767, sample)); // 16bit boundaries

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
    }, 20); // oh yeah 20ms audio packets

    FFMPEG = spawn('ffmpeg', ['-f', 's16le', '-ar', '48k', '-ac', '2', '-i', 'pipe:0', '-f', 'mp3', 'pipe:1']);
    readable.pipe(FFMPEG.stdin);

    // FFMPEG logs
    // FFMPEG.stderr.pipe(process.stderr);

    if (!existsSync('./records')) mkdirSync('./records');
    FFMPEG.stdout.pipe(createWriteStream(`./records/record-${guildID}.mp3`));
  }
});