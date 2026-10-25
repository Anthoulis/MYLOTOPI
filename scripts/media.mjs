// Facts the build reads from the media files themselves, so the pages never disagree with them.
import fs from "node:fs";

// Pixel dimensions from a JPEG or PNG header, so every <img> reserves its space.
export function readImageSize(filePath) {
  const bytes = fs.readFileSync(filePath);

  if (bytes.readUInt32BE(0) === 0x89504e47) {
    return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
  }

  if (bytes[0] === 0xff && bytes[1] === 0xd8) {
    let offset = 2;
    while (offset < bytes.length) {
      const marker = bytes[offset + 1];
      const length = bytes.readUInt16BE(offset + 2);
      const isStartOfFrame = marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker);
      if (isStartOfFrame) {
        return { width: bytes.readUInt16BE(offset + 7), height: bytes.readUInt16BE(offset + 5) };
      }
      offset += 2 + length;
    }
  }

  throw new Error(`Unsupported or unreadable image: ${filePath}`);
}

const BITRATES_KBPS = {
  mpeg1: [0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320],
  mpeg2: [0, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160],
};
const SAMPLE_RATES = { 3: [44100, 48000, 32000], 2: [22050, 24000, 16000], 0: [11025, 12000, 8000] };

// Duration of an MP3 (MPEG audio layer III) in seconds, by walking every frame.
// Exact for constant and variable bitrate alike.
export function readMp3Duration(filePath) {
  const bytes = fs.readFileSync(filePath);
  let offset = 0;
  let seconds = 0;

  // Skip an ID3v2 tag; its size is stored as four 7-bit bytes.
  if (bytes.toString("latin1", 0, 3) === "ID3") {
    offset = 10 + ((bytes[6] << 21) | (bytes[7] << 14) | (bytes[8] << 7) | bytes[9]);
  }

  while (offset + 4 <= bytes.length) {
    const header = bytes.readUInt32BE(offset);
    const isFrame = (header & 0xffe00000) >>> 0 === 0xffe00000 && ((header >> 17) & 3) === 1;
    const version = (header >> 19) & 3;
    const bitrateIndex = (header >> 12) & 15;
    const rateIndex = (header >> 10) & 3;

    if (!isFrame || version === 1 || bitrateIndex === 0 || bitrateIndex === 15 || rateIndex === 3) {
      offset += 1;
      continue;
    }

    const isMpeg1 = version === 3;
    const bitrate = BITRATES_KBPS[isMpeg1 ? "mpeg1" : "mpeg2"][bitrateIndex] * 1000;
    const sampleRate = SAMPLE_RATES[version][rateIndex];
    const samples = isMpeg1 ? 1152 : 576;
    const padding = (header >> 9) & 1;

    seconds += samples / sampleRate;
    offset += Math.floor(((samples / 8) * bitrate) / sampleRate) + padding;
  }

  if (!seconds) {
    throw new Error(`No MP3 frames found in ${filePath}`);
  }
  return seconds;
}

export function formatDuration(seconds) {
  const whole = Math.round(seconds);
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, "0")}`;
}
