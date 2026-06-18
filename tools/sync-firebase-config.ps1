# Genera js/firebase-config.js e inyecta config inline en index.html y app.html
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

$configObj = @"
window.VP_FIREBASE_CONFIG = {
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

$jsFile = @"
/** Firebase — Viajes Peludos Cotizador (auto desde deploy.config.json) */
$configObj
"@

[System.IO.File]::WriteAllText($outPath, $jsFile, [System.Text.UTF8Encoding]::new($false))

$inlineBlock = @"
  <script>
/** Firebase inline — Viajes Peludos */
$configObj
  </script>
"@

foreach ($htmlName in @("index.html", "app.html")) {
  $htmlPath = Join-Path $root $htmlName
  if (-not (Test-Path $htmlPath)) { continue }
  $html = [System.IO.File]::ReadAllText($htmlPath)
  if ($html -match '<!--VP_FIREBASE_INLINE-->') {
    $html = $html -replace '(?s)<!--VP_FIREBASE_INLINE-->.*?(?=<script src=)', "<!--VP_FIREBASE_INLINE-->`n$inlineBlock`n  "
    [System.IO.File]::WriteAllText($htmlPath, $html, [System.Text.UTF8Encoding]::new($false))
  }
}

Write-Output "SYNC_FIREBASE=ok"
