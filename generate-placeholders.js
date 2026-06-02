#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// generate-placeholders.js
// Creates tiny base64 "blur-up" placeholders (LQIP) for every gallery photo.
// Output: src/data/placeholders.json  →  { "travel/travel-031.jpg": "data:image/webp;base64,..." }
//
// Uses sharp (bundled with Astro) to produce ~400-byte placeholders.
// Run with: npm run placeholders   (also called automatically by add-photos.sh)
// ─────────────────────────────────────────────────────────────────────────────

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __dirname  = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.join(__dirname, 'public', 'images');
const OUT_FILE   = path.join(__dirname, 'src', 'data', 'placeholders.json');
const CATEGORIES = ['travel', 'outdoors', 'lifestyle'];
const LQIP_WIDTH = 20; // tiny — CSS blurs and scales it up

const result = {};
let count = 0;

for (const cat of CATEGORIES) {
  const dir = path.join(PUBLIC_DIR, cat);
  const files = fs.readdirSync(dir)
    .filter(f => f.endsWith('.jpg') && !f.includes('cover'));

  for (const file of files) {
    const src = path.join(dir, file);
    try {
      const buf = await sharp(src)
        .resize(LQIP_WIDTH)        // width, auto height
        .webp({ quality: 40 })     // webp is far smaller than jpeg at this size
        .toBuffer();
      result[`${cat}/${file}`] = `data:image/webp;base64,${buf.toString('base64')}`;
      count++;
    } catch (e) {
      console.warn(`  ⚠️  Skipped ${cat}/${file}: ${e.message}`);
    }
  }
  console.log(`  ${cat}: ${files.length} placeholders`);
}

fs.writeFileSync(OUT_FILE, JSON.stringify(result, null, 0) + '\n');
const sizeKB = Math.round(fs.statSync(OUT_FILE).size / 1024);
console.log(`\n✅ Wrote ${count} placeholders to src/data/placeholders.json (${sizeKB} KB total)`);
