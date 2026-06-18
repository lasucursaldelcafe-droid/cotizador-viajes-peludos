# Elimina y recrea el repo en GitHub con Pages por GitHub Actions
$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$GH_USER = "lasucursaldelcafe-droid"
$REPO_NAME = "cotizador-viajes-peludos"
$DEFAULT_BRANCH = "main"
$REMOTE_URL = "https://github.com/$GH_USER/$REPO_NAME.git"
$PAGES_URL = "https://$GH_USER.github.io/$REPO_NAME/"

function Get-GhExe {
    $paths = @(
        "$env:ProgramFiles\GitHub CLI\gh.exe",
        "$env:LocalAppData\Programs\GitHub CLI\gh.exe"
    )
    foreach ($p in $paths) {
        if (Test-Path $p) { return $p }
    }
    $cmd = Get-Command gh -ErrorAction SilentlyContinue
    if ($cmd) { return $cmd.Source }
    return $null
}

function Write-Result {
    param(
        [ValidateSet("ok", "auth_required", "error")]
        [string]$Status,
        [string]$Message = ""
    )
    Write-Output "STATUS=$Status"
    Write-Output "PAGES_URL=$PAGES_URL"
    if ($Message) { Write-Output "MESSAGE=$Message" }
    if ($Status -eq "ok") { exit 0 }
    if ($Status -eq "auth_required") { exit 10 }
    exit 1
}

function Test-GhAuth {
    param([string]$Gh)
    & $Gh auth status 2>$null | Out-Null
    return ($LASTEXITCODE -eq 0)
}

function Enable-PagesWorkflow {
    param([string]$Gh)
    $api = "repos/$GH_USER/$REPO_NAME/pages"
    & $Gh api $api -X POST -f build_type=workflow 2>$null | Out-Null
    if ($LASTEXITCODE -ne 0) {
        & $Gh api $api -X PUT -f build_type=workflow 2>$null | Out-Null
        if ($LASTEXITCODE -ne 0) {
            Write-Result -Status error -Message "No se pudo activar GitHub Pages (workflow)."
        }
    }
}

$gh = Get-GhExe
if (-not $gh) {
    Write-Result -Status auth_required -Message "Instala GitHub CLI: winget install GitHub.cli"
}
if (-not (Test-GhAuth -Gh $gh)) {
    Write-Result -Status auth_required -Message "Ejecuta una vez: gh auth login (cuenta $GH_USER)"
}

$root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
Set-Location $root

$view = & $gh repo view "$GH_USER/$REPO_NAME" 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Output "Eliminando repositorio existente..."
    & $gh repo delete "$GH_USER/$REPO_NAME" --yes
    if ($LASTEXITCODE -ne 0) {
        Write-Result -Status error -Message "No se pudo eliminar el repositorio."
    }
    Start-Sleep -Seconds 2
}

git remote get-url origin 2>$null | Out-Null
if ($LASTEXITCODE -eq 0) {
    git remote remove origin
}

Write-Output "Creando repositorio publico..."
& $gh repo create $REPO_NAME `
    --public `
    --description "Cotizador Viajes Peludos - sitio estatico para celular" `
    --source=. `
    --remote=origin `
    --push
if ($LASTEXITCODE -ne 0) {
    Write-Result -Status error -Message "No se pudo crear el repositorio."
}

Enable-PagesWorkflow -Gh $gh

Write-Output "Disparando despliegue..."
& $gh workflow run deploy-pages.yml --ref $DEFAULT_BRANCH 2>$null | Out-Null

Write-Result -Status ok -Message "Repositorio recreado. Pages se activa en 1-3 minutos."
