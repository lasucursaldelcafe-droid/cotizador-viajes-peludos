#!/usr/bin/env bash
# Entorno Python reproducible para scripts en tools/
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
VENV="$ROOT/.venv"

echo "==> Python: $(python3 --version)"

if [[ ! -d "$VENV" ]]; then
  echo "==> Crear venv en .venv"
  python3 -m venv "$VENV"
fi

# shellcheck disable=SC1091
source "$VENV/bin/activate"

python -m pip install --upgrade pip wheel
pip install -r "$ROOT/requirements.txt"

echo "==> Verificar dependencias"
python -c "from PIL import Image; print('Pillow OK', Image.__version__)"

cat <<EOF

Listo. Activa el entorno con:
  source .venv/bin/activate

Scripts disponibles:
  python tools/discover-tienda-foto.py
  python tools/process_images.py --force   # cuidado: altera fotos oficiales
EOF
