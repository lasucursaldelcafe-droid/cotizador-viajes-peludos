#!/usr/bin/env bash
# Smoke test — Ghost Specialty Coffee (estático)
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BASE="${1:-http://localhost:8765}"
FAIL=0

check() {
  local url="$1"
  local code
  code="$(curl -s -o /dev/null -w '%{http_code}' "$url")"
  if [[ "$code" != "200" ]]; then
    echo "FAIL $code $url"
    FAIL=1
  else
    echo "OK   $code $url"
  fi
}

echo "==> Páginas HTML"
for page in index.html menu.html tienda.html contacto.html nosotros.html origen.html admin.html 404.html; do
  check "$BASE/$page"
done

echo "==> Contenido JSON"
for json in content/brand-slides.json content/menu.json content/instagram.json; do
  check "$BASE/$json"
done

echo "==> CSS tokens (tema oscuro)"
surface="$(curl -s "$BASE/css/tokens.css" | grep -m1 '\-\-surface:' || true)"
if [[ "$surface" != *"#080808"* ]]; then
  echo "FAIL tokens.css no usa --surface #080808"
  FAIL=1
else
  echo "OK   tokens.css surface oscuro"
fi

echo "==> JS módulos"
for js in js/main.js js/nav.js js/slider.js js/home.js js/shop.js js/menu.js js/data/store.js; do
  check "$BASE/$js"
done

echo "==> Validación JSON"
for json in brand-slides menu instagram; do
  if ! python3 -c "import json; json.load(open('$ROOT/content/${json}.json'))" 2>/dev/null; then
    echo "FAIL JSON inválido: content/${json}.json"
    FAIL=1
  else
    echo "OK   content/${json}.json"
  fi
done

if [[ "$FAIL" -eq 0 ]]; then
  echo "STATUS=ok"
  exit 0
fi
echo "STATUS=fail"
exit 1
