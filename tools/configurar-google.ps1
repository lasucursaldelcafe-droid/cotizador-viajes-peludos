# Configura Google Sign-In en Firebase (login + deploy auth/reglas)
$ErrorActionPreference = "Stop"
$root = Split-Path $PSScriptRoot -Parent
Set-Location $root

. "$PSScriptRoot\sync-firebase-config.ps1"

Write-Host ""
Write-Host "=== Viajes Peludos — Configurar Google ===" -ForegroundColor Cyan
Write-Host "Proyecto: viajes-peludos-cotizador"
Write-Host ""

$login = npx --yes firebase-tools@latest login:list 2>&1 | Out-String
if ($login -notmatch '@') {
    Write-Host "Abriendo login de Firebase en el navegador..." -ForegroundColor Yellow
    npx --yes firebase-tools@latest login
    if ($LASTEXITCODE -ne 0) { throw "No se pudo iniciar sesion en Firebase" }
}

Write-Host "Desplegando Google Auth + reglas Firestore..." -ForegroundColor Yellow
. "$PSScriptRoot\firebase-deploy-rules.ps1"

Write-Host ""
Write-Host "Listo. Prueba el login en:" -ForegroundColor Green
Write-Host "https://lasucursaldelcafe-droid.github.io/cotizador-viajes-peludos/"
Write-Host ""
