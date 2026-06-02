#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# add-photos.sh — Add new photos to robertslowinski.com
#
# USAGE
#   ./add-photos.sh <category> <source-folder-or-files...>
#
# EXAMPLES
#   ./add-photos.sh travel ~/iCloudDrive/Website\ Exports/travel/
#   ./add-photos.sh outdoors ~/Downloads/new-outdoors/*.jpg
#   ./add-photos.sh lifestyle ~/iCloudDrive/Website\ Exports/lifestyle/IMG_1234.jpg
#
# WHAT IT DOES
#   1. Optimises each photo for web (max 2400px wide, quality 85) using sips
#   2. Copies it into public/images/<category>/ with the next sequential filename
#   3. Inserts the filename into the NEW section of src/data/photos.ts (newest first)
#   4. Commits and pushes → Cloudflare Pages auto-deploys (~90 seconds)
# ─────────────────────────────────────────────────────────────────────────────

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PHOTOS_TS="$SCRIPT_DIR/src/data/photos.ts"
MAX_WIDTH=2400
QUALITY=85

# ── Validate args ────────────────────────────────────────────────────────────
if [[ $# -lt 2 ]]; then
  echo "Usage: $0 <category> <source-folder-or-files...>"
  echo "  category: travel | outdoors | lifestyle"
  exit 1
fi

CATEGORY="${1,,}"  # lowercase
shift

if [[ "$CATEGORY" != "travel" && "$CATEGORY" != "outdoors" && "$CATEGORY" != "lifestyle" ]]; then
  echo "❌ Unknown category: $CATEGORY  (must be travel, outdoors, or lifestyle)"
  exit 1
fi

DEST_DIR="$SCRIPT_DIR/public/images/$CATEGORY"
mkdir -p "$DEST_DIR"

# ── Collect source files ──────────────────────────────────────────────────────
SOURCE_FILES=()
for arg in "$@"; do
  if [[ -d "$arg" ]]; then
    while IFS= read -r -d '' f; do
      SOURCE_FILES+=("$f")
    done < <(find "$arg" -maxdepth 1 \( -iname "*.jpg" -o -iname "*.jpeg" -o -iname "*.png" \) -print0 | sort -z)
  elif [[ -f "$arg" ]]; then
    SOURCE_FILES+=("$arg")
  else
    echo "⚠️  Skipping (not found): $arg"
  fi
done

if [[ ${#SOURCE_FILES[@]} -eq 0 ]]; then
  echo "❌ No image files found in the specified source(s)."
  exit 1
fi

echo "📸 Found ${#SOURCE_FILES[@]} photo(s) to add to [$CATEGORY]"

# ── Find next available sequence number ──────────────────────────────────────
highest=$(find "$DEST_DIR" -name "${CATEGORY}-[0-9]*.jpg" \
  | grep -oE '[0-9]+\.jpg$' | grep -oE '[0-9]+' | sort -n | tail -1)
highest="${highest:-0}"
# Also skip numbers already used by the cover image filename collision
next=$(( highest + 1 ))

# ── Process each photo ────────────────────────────────────────────────────────
ADDED_FILENAMES=()

for src in "${SOURCE_FILES[@]}"; do
  filename=$(printf '%s-%03d.jpg' "$CATEGORY" "$next")
  dest="$DEST_DIR/$filename"

  echo "  → $(basename "$src")  ⟹  $filename"

  # Copy first, then optimise in-place using sips (macOS built-in)
  cp "$src" "$dest"

  # Resize full-size if wider than MAX_WIDTH (sips preserves aspect ratio)
  sips --resampleWidth "$MAX_WIDTH" \
       --setProperty formatOptions "$QUALITY" \
       "$dest" --out "$dest" \
       > /dev/null 2>&1

  # Generate thumbnail (600px wide, 78% quality) for the masonry grid
  mkdir -p "$DEST_DIR/thumbs"
  sips --resampleWidth 600 "$dest" --out "$DEST_DIR/thumbs/$filename" > /dev/null 2>&1
  sips --setProperty formatOptions 78 "$DEST_DIR/thumbs/$filename" > /dev/null 2>&1

  ADDED_FILENAMES+=("$filename")
  (( next++ ))
done

echo ""
echo "✅ Photos copied and optimised."

# ── Insert into photos.ts (newest first, after the NEW marker) ───────────────
# We build the insertion text and use Python (always available on macOS) to do
# the splice because bash string manipulation with multiline is fragile.

MARKER="↑ NEW — add-photos.sh inserts above this line"
CATEGORY_UPPER="${CATEGORY^}"

# Build the lines to insert (we'll add them newest-first, one per line)
INSERT_LINES=""
for fname in "${ADDED_FILENAMES[@]}"; do
  INSERT_LINES="  '${fname}',\n${INSERT_LINES}"
done

python3 - "$PHOTOS_TS" "$CATEGORY_UPPER" "$MARKER" "$INSERT_LINES" <<'PYEOF'
import sys, re

ts_path   = sys.argv[1]
category  = sys.argv[2]        # e.g. "Travel"
marker    = sys.argv[3]        # the comment line to insert above
insert    = sys.argv[4]        # lines to insert (already formatted)

text = open(ts_path).read()

# Find the marker line *within* the right category block.
# The marker appears once per category, so we find it scoped to the category.
# Strategy: find the Nth occurrence that belongs to this category by searching
# for the category's PINNED header first, then the marker after it.
pinned_header = f"★ PINNED — always at the top"

# Split on the category's own PINNED header to get the right section
parts = text.split(f"// ── {category.upper()}")
if len(parts) < 2:
    print(f"ERROR: Could not find category block for {category}", file=sys.stderr)
    sys.exit(1)

before_cat = f"// ── {category.upper()}".join(parts[:1])
cat_and_after = parts[1]

# Within the category block, find the marker
if marker not in cat_and_after:
    print(f"ERROR: Could not find marker in {category} block", file=sys.stderr)
    sys.exit(1)

cat_parts = cat_and_after.split(marker)
# Insert before the marker line (which sits on its own line preceded by "// ")
new_cat_section = cat_parts[0] + insert.rstrip('\n') + '\n' + marker + cat_parts[1]

new_text = before_cat + f"// ── {category.upper()}" + new_cat_section
open(ts_path, 'w').write(new_text)
print(f"✅ Inserted {len(insert.strip().splitlines())} filename(s) into {category} NEW section.")
PYEOF

# ── Generate blur-up placeholders for the new photos ─────────────────────────
cd "$SCRIPT_DIR"
echo ""
echo "🎨 Generating blur-up placeholders..."
node generate-placeholders.js > /dev/null 2>&1 && echo "   Done."

# ── Git commit and push ───────────────────────────────────────────────────────
git add public/images/"$CATEGORY"/ src/data/photos.ts src/data/placeholders.json

COUNT=${#ADDED_FILENAMES[@]}
COMMIT_MSG="Add $COUNT new $CATEGORY photo(s)"

git commit -m "$COMMIT_MSG"
echo ""
echo "📦 Committed: \"$COMMIT_MSG\""

# Only push if there's a remote configured
if git remote | grep -q .; then
  git push
  echo "🚀 Pushed — Cloudflare Pages will deploy in ~90 seconds."
  echo "   Watch: https://dash.cloudflare.com → Pages → robertslowinski"
else
  echo "ℹ️  No git remote yet. Run the Cloudflare Pages setup, then 'git push'."
fi

echo ""
echo "Done! ${#ADDED_FILENAMES[@]} photo(s) added to $CATEGORY."
