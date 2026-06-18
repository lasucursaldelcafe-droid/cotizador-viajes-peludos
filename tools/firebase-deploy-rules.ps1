# Despliega reglas Firestore y Auth (Google) si hay Firebase CLI o token
$ErrorActionPreference = "SilentlyContinue"
$root = Split-Path $PSScriptRoot -Parent
$cfg = Get-Content (Join-Path $root "deploy.config.json") -Raw | ConvertFrom-Json
$project = $cfg.firebase.projectId
if (-not $project) { Write-Output "FIREBASE_RULES=skip"; exit 0 }

Set-Location $root

$tokenFile = Join-Path $root ".firebase-token"
if (-not $env:FIREBASE_TOKEN -and (Test-Path $tokenFile)) {
    $env:FIREBASE_TOKEN = (Get-Content $tokenFile -Raw).Trim()
}

function Invoke-FirebaseDeploy {
    param([string]$Cmd)
    if ($env:FIREBASE_TOKEN) {
        & $Cmd deploy --only firestore:rules,auth --project $project --non-interactive --token $env:FIREBASE_TOKEN 2>&1 | Out-Null
    } else {
        & $Cmd deploy --only firestore:rules,auth --project $project --non-interactive 2>&1 | Out-Null
    }
    return ($LASTEXITCODE -eq 0)
}

$firebaseCmd = Get-Command firebase -ErrorAction SilentlyContinue
if ($firebaseCmd) {
    if (Invoke-FirebaseDeploy -Cmd "firebase") { Write-Output "FIREBASE_RULES=ok"; exit 0 }
}

$npx = Get-Command npx -ErrorAction SilentlyContinue
if ($npx) {
    if ($env:FIREBASE_TOKEN) {
        npx --yes firebase-tools@latest deploy --only firestore:rules,auth --project $project --non-interactive --token $env:FIREBASE_TOKEN 2>&1 | Out-Null
    } else {
        npx --yes firebase-tools@latest deploy --only firestore:rules,auth --project $project --non-interactive 2>&1 | Out-Null
    }
    if ($LASTEXITCODE -eq 0) { Write-Output "FIREBASE_RULES=ok"; exit 0 }
}

Write-Output "FIREBASE_RULES=skip_no_cli"
