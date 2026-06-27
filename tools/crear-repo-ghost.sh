#!/usr/bin/env bash
# Crea el repositorio ghost_coffee_shop y publica en GitHub Pages
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

OWNER="lasucursaldelcafe-droid"
REPO="ghost_coffee_shop"
BRANCH="main"
REMOTE="ghost"
PAGES_URL="https://${OWNER}.github.io/${REPO}/"

echo ">>> Creando repositorio ${OWNER}/${REPO}..."

if ! command -v gh >/dev/null 2>&1; then
  echo "STATUS=error"
  echo "MESSAGE=Instala GitHub CLI: https://cli.github.com/"
  exit 1
fi

if [[ -f "$ROOT/.github-token" ]]; then
  export GH_TOKEN="$(tr -d '[:space:]' < "$ROOT/.github-token")"
fi

if ! gh auth status >/dev/null 2>&1; then
  echo "STATUS=auth_required"
  echo "MESSAGE=Ejecuta: gh auth login"
  echo "PAGES_URL=$PAGES_URL"
  exit 10
fi

# Crear repo si no existe
if ! gh repo view "${OWNER}/${REPO}" >/dev/null 2>&1; then
  gh repo create "${OWNER}/${REPO}" \
    --public \
    --description "Ghost Specialty Coffee — café de especialidad Cali" \
    --homepage "$PAGES_URL"
  echo "Repositorio creado."
else
  echo "Repositorio ya existe."
fi

REMOTE_URL="https://github.com/${OWNER}/${REPO}.git"

if git remote get-url "$REMOTE" >/dev/null 2>&1; then
  git remote set-url "$REMOTE" "$REMOTE_URL"
else
  git remote add "$REMOTE" "$REMOTE_URL"
fi

# Asegurar rama main con el contenido Ghost
CURRENT_BRANCH="$(git branch --show-current)"
git push -u "$REMOTE" "${CURRENT_BRANCH}:${BRANCH}" --force

# Activar GitHub Pages (workflow)
gh api -X POST "repos/${OWNER}/${REPO}/pages" -f build_type=workflow 2>/dev/null \
  || gh api -X PUT "repos/${OWNER}/${REPO}/pages" -f build_type=workflow 2>/dev/null \
  || true

# Disparar deploy
gh workflow run deploy-pages.yml --repo "${OWNER}/${REPO}" --ref "$BRANCH" 2>/dev/null || true

echo "STATUS=ok"
echo "PAGES_URL=$PAGES_URL"
echo "REPO_URL=https://github.com/${OWNER}/${REPO}"
echo "MESSAGE=Repositorio publicado. Pages activo en 1-3 minutos."
