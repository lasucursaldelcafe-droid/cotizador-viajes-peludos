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

echo "==> CSS desktop"
check "$BASE/css/desktop.css"

echo "==> Estructura slider (controles en hero, no dentro de #ghostHeroSlider)"
if grep -q 'id="ghostHeroSlider"' "$ROOT/index.html" \
  && grep -q 'ghost-slider__prev' "$ROOT/index.html" \
  && grep -q 'id="ghostBrandDots"' "$ROOT/index.html"; then
  echo "OK   index.html slider markup presente"
else
  echo "FAIL index.html slider markup incompleto"
  FAIL=1
fi

if grep -q "closest('.ghost-hero')" "$ROOT/js/slider.js"; then
  echo "OK   slider.js busca controles en .ghost-hero"
else
  echo "FAIL slider.js no enlaza controles del hero"
  FAIL=1
fi

if ! grep -q "toggleAttribute('hidden'" "$ROOT/js/slider.js"; then
  echo "OK   slider.js no usa hidden (flex intacto)"
else
  echo "FAIL slider.js aún usa hidden en slides"
  FAIL=1
fi

echo "==> Rutas asset() en fetch de contenido"
for f in js/home.js js/shop.js js/data/store.js; do
  if grep -q "fetch(asset(" "$ROOT/$f"; then
    echo "OK   $f usa fetch(asset(...))"
  else
    echo "FAIL $f sin fetch(asset(...))"
    FAIL=1
  fi
done

if [[ "$FAIL" -eq 0 ]]; then
  echo "STATUS=ok"
  exit 0
fi
echo "STATUS=fail"
exit 1
