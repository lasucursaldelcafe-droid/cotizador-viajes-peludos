#!/usr/bin/env bash
# Descubre y publica la foto de tienda sin intervención manual.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ARTIFACT="/opt/cursor/artifacts/assets/tienda-interior-ghost.jpg"
INCOMING="$ROOT/assets/images/brand/incoming/tienda.jpg"

# Sincronizar artefacto generado o adjunto del agente, si existe.
if [[ -f "$ARTIFACT" ]]; then
  cp -f "$ARTIFACT" "$INCOMING"
fi

python3 "$ROOT/tools/discover-tienda-foto.py" "$@"
