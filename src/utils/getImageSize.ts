import { readFileSync } from 'node:fs';

/**
 * Reads JPEG/PNG dimensions from file header without fully decoding the image.
 * Fast — only reads the first few KB of the file.
 */
export function getImageSize(filepath: string): { width: number; height: number } {
  try {
    const buf = readFileSync(filepath);

    // JPEG
    if (buf[0] === 0xFF && buf[1] === 0xD8) {
      let offset = 2;
      while (offset < buf.length - 8) {
        if (buf[offset] !== 0xFF) break;
        const marker = buf[offset + 1];
        const segLen = buf.readUInt16BE(offset + 2);
        // SOF markers: C0–C3, C5–C7, C9–CB, CD–CF
        if (
          (marker >= 0xC0 && marker <= 0xC3) ||
          (marker >= 0xC5 && marker <= 0xC7) ||
          (marker >= 0xC9 && marker <= 0xCB) ||
          (marker >= 0xCD && marker <= 0xCF)
        ) {
          const height = buf.readUInt16BE(offset + 5);
          const width  = buf.readUInt16BE(offset + 7);
          return { width, height };
        }
        offset += 2 + segLen;
      }
    }

    // PNG
    if (buf[0] === 0x89 && buf[1] === 0x50) {
      const width  = buf.readUInt32BE(16);
      const height = buf.readUInt32BE(20);
      return { width, height };
    }
  } catch {
    // fall through to default
  }
  return { width: 600, height: 400 }; // safe fallback
}
