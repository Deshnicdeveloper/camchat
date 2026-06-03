#!/usr/bin/env bash
# Re-optimize source screenshots from presentation/*.PNG into deck/assets/shots/*.jpg
# Requires ImageMagick (`convert`).
set -euo pipefail
SRC="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$(cd "$(dirname "$0")" && pwd)/assets/shots"
mkdir -p "$OUT"
for f in "$SRC"/*.PNG; do
  [ -e "$f" ] || continue
  b="$(basename "$f" .PNG)"
  convert "$f" -resize 640x -strip -quality 82 "$OUT/${b}.jpg"
  echo "optimized $b"
done
echo "Done -> $OUT"
