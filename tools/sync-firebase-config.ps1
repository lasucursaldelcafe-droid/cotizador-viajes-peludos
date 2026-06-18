# Genera js/firebase-config.js desde deploy.config.json
$ErrorActionPreference = "Stop"
$root = Split-Path $PSScriptRoot -Parent
$cfgPath = Join-Path $root "deploy.config.json"
$outPath = Join-Path $root "js\firebase-config.js"

if (-not (Test-Path $cfgPath)) { return }

$cfg = Get-Content $cfgPath -Raw | ConvertFrom-Json
$fb = $cfg.firebase
if (-not $fb) { return }

$emails = @()
if ($fb.adminEmails) { $emails = @($fb.adminEmails) }
elseif ($cfg.admin_emails) { $emails = @($cfg.admin_emails) }

$emailLines = ($emails | ForEach-Object { "'$_'" }) -join ", "
$enabled = if ($null -ne $fb.enabled) { $fb.enabled.ToString().ToLower() } else { "true" }

$content = @"
/** Firebase — Viajes Peludos Cotizador (auto desde deploy.config.json) */
const VP_FIREBASE_CONFIG = {
  enabled: $enabled,
  apiKey: '$($fb.apiKey)',
  authDomain: '$($fb.authDomain)',
  projectId: '$($fb.projectId)',
  storageBucket: '$($fb.storageBucket)',
  messagingSenderId: '$($fb.messagingSenderId)',
  appId: '$($fb.appId)',
  adminEmails: [$emailLines]
};
"@

[System.IO.File]::WriteAllText($outPath, $content, [System.Text.UTF8Encoding]::new($false))
Write-Output "SYNC_FIREBASE=ok"
