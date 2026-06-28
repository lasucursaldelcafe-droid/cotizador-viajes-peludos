#!/usr/bin/env bash
# Reemplaza assets/images/brand/tienda-real.jpg con la foto real de la tienda.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="${1:-$ROOT/assets/images/brand/incoming/tienda.jpg}"
DEST="$ROOT/assets/images/brand/tienda-real.jpg"

if [[ ! -f "$SRC" ]]; then
  echo "No se encontró: $SRC"
  echo "Coloca la foto en assets/images/brand/incoming/tienda.jpg o pasa la ruta como argumento."
  exit 1
fi

python3 << PY
from pathlib import Path
from PIL import Image

src = Path("$SRC")
dest = Path("$DEST")
im = Image.open(src).convert("RGB")
max_w = 1920
if im.width > max_w:
    h = int(im.height * max_w / im.width)
    im = im.resize((max_w, h), Image.Resampling.LANCZOS)
im.save(dest, "JPEG", quality=88, optimize=True)
print(f"OK: {dest} ({im.width}x{im.height})")
PY
