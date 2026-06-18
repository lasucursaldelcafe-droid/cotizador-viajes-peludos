# Despliega reglas Firestore si Firebase CLI esta disponible
$ErrorActionPreference = "SilentlyContinue"
$root = Split-Path $PSScriptRoot -Parent
$cfg = Get-Content (Join-Path $root "deploy.config.json") -Raw | ConvertFrom-Json
$project = $cfg.firebase.projectId
if (-not $project) { Write-Output "FIREBASE_RULES=skip"; exit 0 }

Set-Location $root

$firebaseCmd = Get-Command firebase -ErrorAction SilentlyContinue
if (-not $firebaseCmd) {
    $npx = Get-Command npx -ErrorAction SilentlyContinue
    if ($npx) {
        npx --yes firebase-tools@13.0.0 deploy --only firestore:rules --project $project --non-interactive 2>&1 | Out-Null
        if ($LASTEXITCODE -eq 0) { Write-Output "FIREBASE_RULES=ok"; exit 0 }
    }
    Write-Output "FIREBASE_RULES=skip_no_cli"
    exit 0
}

firebase deploy --only firestore:rules --project $project --non-interactive 2>&1 | Out-Null
if ($LASTEXITCODE -eq 0) { Write-Output "FIREBASE_RULES=ok" } else { Write-Output "FIREBASE_RULES=skip_auth" }
