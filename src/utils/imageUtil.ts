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

type Size = {
  width: number;
  height: number;
}

const PNG_SIG = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
const JPEG = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0]); // SOI + APP0

export function getImageSize(img: Buffer): Size | null {
  if (img.subarray(0, PNG_SIG.length).equals(PNG_SIG)) {
    if (img.length < 24) return null;

    return {
      width: img.readUInt32BE(16), // 8 + 4 + 4
      height: img.readUInt32BE(20), // 8 + 4 + 4 + 4
    };
  } else {
    if (img.length < 20) return null;

    if (!img.subarray(0, 4).equals(JPEG) || !img.subarray(6, 10).equals(Buffer.from("JFIF"))) return null;

    let segmentLen = img.readUInt16BE(4);
    let offset = 4;

    while (offset < img.length) {
      offset += segmentLen;

      if (img[offset] != 0xff) return null; // Not a start marker
      if (img[offset + 1] == 0xC0) {
        return {
          width: img.readUInt16BE(offset + 7),
          height: img.readUInt16BE(offset + 5),
        }; // SOF0
      }

      offset += 2;
      segmentLen = img.readUInt16BE(offset);
    }
  }

  return null;
}