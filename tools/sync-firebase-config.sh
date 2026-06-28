#!/usr/bin/env bash
# Genera js/firebase-config.js desde deploy.config.json (Linux / Cloud Agent)
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CFG="$ROOT/deploy.config.json"
OUT="$ROOT/js/firebase-config.js"

[[ -f "$CFG" ]] || exit 0
command -v jq >/dev/null 2>&1 || { echo "SYNC_FIREBASE=skip (jq no instalado)"; exit 0; }

ENABLED="$(jq -r '.firebase.enabled // false' "$CFG")"
REQUIRE_AUTH="$(jq -r '.firebase.requireAuth // false' "$CFG")"
API_KEY="$(jq -r '.firebase.apiKey // ""' "$CFG")"
AUTH_DOMAIN="$(jq -r '.firebase.authDomain // ""' "$CFG")"
PROJECT_ID="$(jq -r '.firebase.projectId // ""' "$CFG")"
STORAGE_BUCKET="$(jq -r '.firebase.storageBucket // ""' "$CFG")"
MSG_ID="$(jq -r '.firebase.messagingSenderId // ""' "$CFG")"
APP_ID="$(jq -r '.firebase.appId // ""' "$CFG")"
ADMIN_PIN="$(jq -r '.firebase.adminPin // "ghost2026"' "$CFG")"

EMAILS_JSON="$(jq -c '.firebase.adminEmails // []' "$CFG")"

cat > "$OUT" <<EOF
/** Firebase — Ghost Specialty Coffee (auto desde deploy.config.json) */
window.VP_FIREBASE_CONFIG = {
  enabled: ${ENABLED},
  requireAuth: ${REQUIRE_AUTH},
  apiKey: '${API_KEY}',
  authDomain: '${AUTH_DOMAIN}',
  projectId: '${PROJECT_ID}',
  storageBucket: '${STORAGE_BUCKET}',
  messagingSenderId: '${MSG_ID}',
  appId: '${APP_ID}',
  adminEmails: ${EMAILS_JSON},
  adminPin: '${ADMIN_PIN}',
};
EOF

echo "SYNC_FIREBASE=ok"
