# Publicación automática Cotizador Viajes Peludos -> GitHub Pages
$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$GH_USER = "lasucursaldelcafe-droid"
$REPO_NAME = "cotizador-viajes-peludos"
$DEFAULT_BRANCH = "main"
$REMOTE_URL = "https://github.com/$GH_USER/$REPO_NAME.git"
$PAGES_URL = "https://$GH_USER.github.io/$REPO_NAME/"

function Write-DeployResult {
    param(
        [ValidateSet("ok", "auth_required", "error")]
        [string]$Status,
        [string]$Message = "",
        [string]$PagesUrl = $PAGES_URL
    )
    $obj = [ordered]@{
        STATUS    = $Status
        PAGES_URL = if ($Status -eq "ok") { $PagesUrl } else { $PAGES_URL }
        MESSAGE   = $Message
    }
    Write-Output ("STATUS=$Status")
    Write-Output ("PAGES_URL=$PagesUrl")
    if ($Message) { Write-Output ("MESSAGE=$Message") }
    Write-Output ($obj | ConvertTo-Json -Compress)
    if ($Status -eq "ok") { exit 0 }
    if ($Status -eq "auth_required") { exit 10 }
    exit 1
}

function Ensure-Git {
    if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
        Write-DeployResult -Status error -Message "Git no está instalado o no está en PATH."
    }
}

function Get-ProjectRoot {
    return (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
}

function Ensure-GhCli {
    if (Get-Command gh -ErrorAction SilentlyContinue) { return $true }
    if (-not (Get-Command winget -ErrorAction SilentlyContinue)) { return $false }
    try {
        $null = winget install --id GitHub.cli -e --accept-source-agreements --accept-package-agreements --silent 2>&1
    } catch { }
    $paths = @(
        "$env:ProgramFiles\GitHub CLI\gh.exe",
        "$env:LocalAppData\Programs\GitHub CLI\gh.exe"
    )
    foreach ($p in $paths) {
        if (Test-Path $p) {
            $dir = Split-Path $p -Parent
            if ($env:Path -notlike "*$dir*") { $env:Path = "$dir;$env:Path" }
            return $true
        }
    }
    return [bool](Get-Command gh -ErrorAction SilentlyContinue)
}

function Test-GhAuth {
    try {
        gh auth status 2>$null | Out-Null
        return ($LASTEXITCODE -eq 0)
    } catch { return $false }
}

function Ensure-RemoteOrigin {
    param([string]$Root)
    Push-Location $Root
    try {
        $hasOrigin = $false
        try {
            $url = git remote get-url origin 2>$null
            if ($LASTEXITCODE -eq 0 -and $url) { $hasOrigin = $true }
        } catch { }
        if (-not $hasOrigin) {
            git remote add origin $REMOTE_URL
        } else {
            $current = (git remote get-url origin).Trim()
            if ($current -ne $REMOTE_URL) {
                git remote set-url origin $REMOTE_URL
            }
        }
    } finally { Pop-Location }
}

function Test-SecretPath {
    param([string]$Path)
    $name = Split-Path $Path -Leaf
    $lower = $name.ToLowerInvariant()
    if ($lower -eq ".env" -or $lower.StartsWith(".env.")) { return $true }
    if ($lower -eq "credentials.json") { return $true }
    if ($lower -like "*.pem") { return $true }
    return $false
}

function Commit-PendingChanges {
    param([string]$Root)
    Push-Location $Root
    try {
        git add -A
        $porcelain = git status --porcelain
        if (-not $porcelain) { return $false }
        $toUnstage = @()
        foreach ($line in ($porcelain -split "`n")) {
            if (-not $line.Trim()) { continue }
            $path = $line.Substring(3).Trim().Trim('"')
            if (Test-SecretPath $path) { $toUnstage += $path }
        }
        foreach ($p in $toUnstage) {
            git reset HEAD -- $p 2>$null | Out-Null
        }
        $after = git status --porcelain
        if (-not $after) { return $false }
        git commit --trailer "Co-authored-by: Cursor <cursoragent@cursor.com>" -m "Actualizar sitio Cotizador Viajes Peludos"
        return ($LASTEXITCODE -eq 0)
    } finally { Pop-Location }
}

function Ensure-RepoExists {
    $view = gh repo view "$GH_USER/$REPO_NAME" 2>$null
    if ($LASTEXITCODE -ne 0) {
        gh repo create $REPO_NAME --public --source=. --remote=origin --push
        if ($LASTEXITCODE -ne 0) {
            Write-DeployResult -Status error -Message "No se pudo crear el repositorio remoto."
        }
        return
    }
    Ensure-RemoteOrigin -Root (Get-Location).Path
    git push -u origin $DEFAULT_BRANCH
    if ($LASTEXITCODE -ne 0) {
        Write-DeployResult -Status error -Message "git push falló. Verifica permisos y conexión."
    }
}

function Enable-GitHubPages {
    $apiPath = "repos/$GH_USER/$REPO_NAME/pages"
    $postArgs = @(
        "api", $apiPath, "-X", "POST",
        "-f", "build_type=legacy",
        "-f", "source[branch]=$DEFAULT_BRANCH",
        "-f", "source[path]=/"
    )
    gh @postArgs 2>$null | Out-Null
    if ($LASTEXITCODE -ne 0) {
        $putArgs = @(
            "api", $apiPath, "-X", "PUT",
            "-f", "build_type=legacy",
            "-f", "source[branch]=$DEFAULT_BRANCH",
            "-f", "source[path]=/"
        )
        gh @putArgs 2>$null | Out-Null
        if ($LASTEXITCODE -ne 0) {
            Write-DeployResult -Status error -Message "No se pudo configurar GitHub Pages vía API."
        }
    }
}

Ensure-Git
$root = Get-ProjectRoot
Set-Location $root

Ensure-RemoteOrigin -Root $root

$ghOk = Ensure-GhCli
if (-not $ghOk) {
    Write-DeployResult -Status auth_required -Message "Instala GitHub CLI: winget install GitHub.cli Luego ejecuta una vez: gh auth login"
}

if (-not (Test-GhAuth)) {
    Write-DeployResult -Status auth_required -Message "GitHub CLI no autenticado. Ejecuta una vez: gh auth login (HTTPS, cuenta lasucursaldelcafe-droid)"
}

[void](Commit-PendingChanges -Root $root)
Ensure-RepoExists
Enable-GitHubPages

Write-DeployResult -Status ok -Message "Publicación completada." -PagesUrl $PAGES_URL

