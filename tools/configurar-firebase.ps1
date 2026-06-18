# Configura Firebase y escribe js/firebase-config.js
$ErrorActionPreference = "Stop"
$root = Split-Path $PSScriptRoot -Parent
$out = Join-Path $root "js\firebase-config.js"

Write-Host ""
Write-Host "=== Configurar Firebase - Viajes Peludos ===" -ForegroundColor Magenta
Write-Host ""
Write-Host "Antes de continuar, en https://console.firebase.google.com :"
Write-Host "  1. Crear proyecto"
Write-Host "  2. Authentication -> Google -> Habilitar"
Write-Host "  3. Authentication -> Settings -> Authorized domains -> agregar:"
Write-Host "     lasucursaldelcafe-droid.github.io"
Write-Host "  4. Firestore -> Crear base de datos"
Write-Host "  5. Firestore -> Rules -> pegar contenido de firestore.rules"
Write-Host "  6. Project settings -> Web app -> copiar firebaseConfig"
Write-Host ""

$apiKey = Read-Host "apiKey"
$authDomain = Read-Host "authDomain"
$projectId = Read-Host "projectId"
$storageBucket = Read-Host "storageBucket"
$messagingSenderId = Read-Host "messagingSenderId"
$appId = Read-Host "appId"
$adminEmail = Read-Host "Correo administrador (Gmail con el que iniciaran sesion)"

$content = @"
/** Generado por tools/configurar-firebase.ps1 */
const VP_FIREBASE_CONFIG = {
  enabled: true,
  apiKey: '$apiKey',
  authDomain: '$authDomain',
  projectId: '$projectId',
  storageBucket: '$storageBucket',
  messagingSenderId: '$messagingSenderId',
  appId: '$appId',
  adminEmails: [
    '$adminEmail'
  ]
};
"@

Set-Content -Path $out -Value $content -Encoding UTF8
Write-Host ""
Write-Host "Listo: $out" -ForegroundColor Green
Write-Host "Ejecuta deploy-auto.bat o escribe 'publica' en Cursor para subir cambios."
