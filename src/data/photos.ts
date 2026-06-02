// ─────────────────────────────────────────────────────────────────────────────
// Photo ordering for robertslowinski.com
//
// PINNED photos are managed via the admin UI (run: npm run admin)
// or by editing src/data/pinned.json directly.
//
// HIDDEN photos are managed the same way and never appear on the live site.
// Hiding does NOT delete the file — it just removes it from the gallery, so
// you can always un-hide later. Managed in src/data/hidden.json.
//
// NEW photos are inserted automatically by add-photos.sh.
//
// ARCHIVE is the original curated order — leave it alone.
// ─────────────────────────────────────────────────────────────────────────────

import pinnedData from './pinned.json';
import hiddenData from './hidden.json';

function toFile(category: string, filename: string): string {
  return `/images/${category}/${filename}`;
}

// ── TRAVEL ───────────────────────────────────────────────────────────────────

const travelPinned = pinnedData.travel;

// ↑ NEW — add-photos.sh inserts above this line (do not remove this comment)
const travelNew: string[] = [
];
// ↓ END NEW — do not remove this comment

// ARCHIVE — original curated order, leave as-is
const travelArchive = [
  'travel-019.jpg','travel-028.jpg','travel-077.jpg',
  'travel-056.jpg','travel-049.jpg','travel-085.jpg','travel-050.jpg','travel-054.jpg','travel-035.jpg',
  'travel-029.jpg','travel-022.jpg','travel-026.jpg','travel-080.jpg','travel-078.jpg','travel-073.jpg',
  'travel-072.jpg','travel-079.jpg','travel-071.jpg','travel-045.jpg','travel-040.jpg','travel-036.jpg',
  'travel-032.jpg','travel-012.jpg','travel-011.jpg','travel-038.jpg','travel-065.jpg','travel-057.jpg',
  'travel-cover.jpg','travel-063.jpg','travel-059.jpg','travel-058.jpg','travel-003.jpg','travel-051.jpg',
  'travel-046.jpg','travel-044.jpg','travel-042.jpg','travel-041.jpg','travel-037.jpg',
  'travel-034.jpg','travel-027.jpg','travel-025.jpg','travel-005.jpg','travel-021.jpg','travel-020.jpg',
  'travel-018.jpg','travel-017.jpg','travel-014.jpg','travel-039.jpg','travel-008.jpg','travel-015.jpg','travel-013.jpg',
  'travel-010.jpg',
];

// ── OUTDOORS ─────────────────────────────────────────────────────────────────

const outdoorsPinned = pinnedData.outdoors;

// ↑ NEW — add-photos.sh inserts above this line (do not remove this comment)
const outdoorsNew: string[] = [
];
// ↓ END NEW — do not remove this comment

// ARCHIVE — original curated order, leave as-is
const outdoorsArchive = [
  'outdoors-018.jpg','outdoors-017.jpg',
  'outdoors-015.jpg','outdoors-021.jpg','outdoors-037.jpg','outdoors-010.jpg','outdoors-007.jpg',
  'outdoors-063.jpg','outdoors-020.jpg','outdoors-062.jpg','outdoors-cover.jpg','outdoors-059.jpg',
  'outdoors-060.jpg','outdoors-057.jpg','outdoors-056.jpg','outdoors-053.jpg','outdoors-009.jpg',
  'outdoors-051.jpg','outdoors-049.jpg','outdoors-050.jpg','outdoors-048.jpg','outdoors-047.jpg',
  'outdoors-044.jpg','outdoors-046.jpg','outdoors-043.jpg','outdoors-041.jpg','outdoors-040.jpg',
  'outdoors-039.jpg','outdoors-038.jpg','outdoors-036.jpg','outdoors-034.jpg','outdoors-035.jpg',
  'outdoors-031.jpg','outdoors-023.jpg','outdoors-033.jpg','outdoors-032.jpg','outdoors-028.jpg',
  'outdoors-027.jpg','outdoors-026.jpg','outdoors-024.jpg','outdoors-025.jpg','outdoors-003.jpg',
  'outdoors-022.jpg','outdoors-019.jpg','outdoors-014.jpg','outdoors-011.jpg','outdoors-061.jpg',
  'outdoors-013.jpg','outdoors-012.jpg','outdoors-008.jpg','outdoors-006.jpg','outdoors-002.jpg',
  'outdoors-004.jpg',
];

// ── LIFESTYLE ────────────────────────────────────────────────────────────────

const lifestylePinned = pinnedData.lifestyle;

// ↑ NEW — add-photos.sh inserts above this line (do not remove this comment)
const lifestyleNew: string[] = [
];
// ↓ END NEW — do not remove this comment

// ARCHIVE — original curated order, leave as-is
const lifestyleArchive = [
  'lifestyle-077.jpg','lifestyle-092.jpg',
  'lifestyle-101.jpg','lifestyle-081.jpg','lifestyle-097.jpg','lifestyle-036.jpg','lifestyle-028.jpg',
  'lifestyle-107.jpg','lifestyle-054.jpg','lifestyle-086.jpg','lifestyle-003.jpg','lifestyle-106.jpg',
  'lifestyle-109.jpg','lifestyle-102.jpg','lifestyle-105.jpg','lifestyle-103.jpg','lifestyle-100.jpg',
  'lifestyle-098.jpg','lifestyle-095.jpg','lifestyle-034.jpg','lifestyle-093.jpg','lifestyle-090.jpg',
  'lifestyle-cover.jpg','lifestyle-089.jpg','lifestyle-087.jpg','lifestyle-085.jpg','lifestyle-084.jpg',
  'lifestyle-083.jpg','lifestyle-082.jpg','lifestyle-080.jpg','lifestyle-079.jpg','lifestyle-078.jpg',
  'lifestyle-075.jpg','lifestyle-074.jpg','lifestyle-073.jpg','lifestyle-071.jpg','lifestyle-070.jpg',
  'lifestyle-069.jpg','lifestyle-068.jpg','lifestyle-067.jpg','lifestyle-065.jpg','lifestyle-064.jpg',
  'lifestyle-063.jpg','lifestyle-062.jpg','lifestyle-091.jpg','lifestyle-061.jpg','lifestyle-060.jpg',
  'lifestyle-059.jpg','lifestyle-058.jpg','lifestyle-057.jpg','lifestyle-055.jpg','lifestyle-053.jpg',
  'lifestyle-049.jpg','lifestyle-050.jpg','lifestyle-048.jpg','lifestyle-047.jpg','lifestyle-046.jpg',
  'lifestyle-045.jpg','lifestyle-044.jpg','lifestyle-043.jpg','lifestyle-041.jpg','lifestyle-042.jpg',
  'lifestyle-039.jpg','lifestyle-038.jpg','lifestyle-022.jpg','lifestyle-040.jpg','lifestyle-037.jpg',
  'lifestyle-035.jpg','lifestyle-033.jpg','lifestyle-032.jpg','lifestyle-004.jpg','lifestyle-031.jpg',
  'lifestyle-030.jpg','lifestyle-029.jpg','lifestyle-027.jpg','lifestyle-026.jpg','lifestyle-025.jpg',
  'lifestyle-024.jpg','lifestyle-018.jpg','lifestyle-020.jpg','lifestyle-021.jpg','lifestyle-017.jpg',
  'lifestyle-016.jpg','lifestyle-013.jpg','lifestyle-012.jpg','lifestyle-011.jpg','lifestyle-006.jpg',
  'lifestyle-010.jpg','lifestyle-009.jpg','lifestyle-008.jpg','lifestyle-007.jpg',
];

// ── Exports ───────────────────────────────────────────────────────────────────
// Combines pinned + new + archive for each category, minus any hidden photos.

function makePhotos(
  category: string,
  pinned: string[],
  newPhotos: string[],
  archive: string[],
  hidden: string[],
) {
  const hide = new Set(hidden);
  // Deduplicate: pinned photos are removed from archive/new so they only appear once.
  const seen = new Set([...pinned, ...newPhotos]);
  // Filter out hidden photos everywhere, and dedupe the archive.
  const filteredPinned  = pinned.filter(f => !hide.has(f));
  const filteredNew     = newPhotos.filter(f => !hide.has(f));
  const filteredArchive = archive.filter(f => !seen.has(f) && !hide.has(f));
  return [...filteredPinned, ...filteredNew, ...filteredArchive].map((filename, i) => ({
    src: toFile(category, filename),
    alt: `${category.charAt(0).toUpperCase() + category.slice(1)} photograph ${i + 1}`,
    index: i,
  }));
}

export const travelPhotos   = makePhotos('travel',    travelPinned,    travelNew,    travelArchive,    hiddenData.travel);
export const outdoorsPhotos = makePhotos('outdoors',  outdoorsPinned,  outdoorsNew,  outdoorsArchive,  hiddenData.outdoors);
export const lifestylePhotos = makePhotos('lifestyle', lifestylePinned, lifestyleNew, lifestyleArchive, hiddenData.lifestyle);
