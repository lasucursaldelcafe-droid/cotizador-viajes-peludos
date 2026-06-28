#!/usr/bin/env bash
# Automatización total Ghost Specialty Coffee (Linux / Cloud Agent)
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "==> Sincronizar Firebase config"
bash "$ROOT/tools/sync-firebase-config.sh" || true

echo "==> Sincronizar foto de tienda"
bash "$ROOT/tools/automatizar-tienda-foto.sh" || true

if [[ -n "$(git status --porcelain assets/images/brand/tienda-real.jpg 2>/dev/null)" ]]; then
  git add assets/images/brand/tienda-real.jpg
fi

BRANCH="$(git rev-parse --abbrev-ref HEAD)"
MSG="Automatizar: foto tienda + publicación Ghost Specialty Coffee"

if [[ -n "$(git status --porcelain)" ]]; then
  git add -A
  git commit -m "$MSG" || true
fi

if [[ "$BRANCH" == "HEAD" || "$BRANCH" == "main" ]]; then
  git push origin HEAD:main
else
  git push -u origin "$BRANCH"
fi

CFG="$ROOT/deploy.config.json"
if command -v jq >/dev/null 2>&1 && [[ -f "$CFG" ]]; then
  PAGES="$(jq -r '.pages_url // .site_url // empty' "$CFG")"
  LOGIN="$(jq -r '.login_url // empty' "$CFG")"
  echo "STATUS=ok"
  echo "app_url=$PAGES"
  echo "login_url=$LOGIN"
else
  echo "STATUS=ok"
  echo "app_url=https://lasucursaldelcafe-droid.github.io/cotizador-viajes-peludos/"
fi
