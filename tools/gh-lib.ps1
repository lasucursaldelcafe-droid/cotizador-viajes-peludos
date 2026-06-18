# Funciones compartidas para automatizacion GitHub (sin prompts)
$ErrorActionPreference = "Stop"

function Get-ProjectRoot {
    return (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
}

function Get-DeployConfig {
    $configPath = Join-Path (Get-ProjectRoot) "deploy.config.json"
    if (-not (Test-Path $configPath)) {
        throw "No existe deploy.config.json"
    }
    return Get-Content $configPath -Raw | ConvertFrom-Json
}

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

function Ensure-GhInstalled {
    if (Get-GhExe) { return (Get-GhExe) }
    if (Get-Command winget -ErrorAction SilentlyContinue) {
        winget install --id GitHub.cli -e --accept-source-agreements --accept-package-agreements --silent 2>&1 | Out-Null
    }
    $exe = Get-GhExe
    if (-not $exe) { throw "GitHub CLI no instalada" }
    return $exe
}

function Ensure-GhToken {
    param([string]$Gh)
    if ($env:GH_TOKEN) { return $true }
    $tokenFile = Join-Path (Get-ProjectRoot) ".github-token"
    if (Test-Path $tokenFile) {
        $env:GH_TOKEN = (Get-Content $tokenFile -Raw).Trim()
        return $true
    }
    $prev = $ErrorActionPreference
    $ErrorActionPreference = "SilentlyContinue"
    try {
        & $Gh auth status 2>&1 | Out-Null
        if ($LASTEXITCODE -eq 0) {
            $env:GH_TOKEN = (& $Gh auth token 2>&1).Trim()
            return [bool]$env:GH_TOKEN
        }
    } finally {
        $ErrorActionPreference = $prev
    }
    return $false
}

function Invoke-Gh {
    param(
        [string]$Gh,
        [Parameter(ValueFromRemainingArguments = $true)]
        [string[]]$Args
    )
    & $Gh @Args
}

function Write-DeployStatus {
    param(
        [ValidateSet("ok", "auth_required", "error")]
        [string]$Status,
        [string]$Message = "",
        [string]$PagesUrl = ""
    )
    Write-Output "STATUS=$Status"
    if ($PagesUrl) { Write-Output "PAGES_URL=$PagesUrl" }
    if ($Message) { Write-Output "MESSAGE=$Message" }
    $obj = [ordered]@{
        STATUS    = $Status
        PAGES_URL = $PagesUrl
        MESSAGE   = $Message
    }
    Write-Output ($obj | ConvertTo-Json -Compress)
}

function Test-SecretPath {
    param([string]$Path)
    $name = Split-Path $Path -Leaf
    $lower = $name.ToLowerInvariant()
    if ($lower -eq ".env" -or $lower.StartsWith(".env.")) { return $true }
    if ($lower -eq ".github-token" -or $lower -eq ".gh-token") { return $true }
    if ($lower -eq "credentials.json") { return $true }
    if ($lower -like "*.pem") { return $true }
    return $false
}

function Commit-AllSafe {
    param(
        [string]$Root,
        [string]$Message = "Actualizar cotizador Viajes Peludos"
    )
    Push-Location $Root
    try {
        git add -A
        $porcelain = git status --porcelain
        if (-not $porcelain) { return $false }
        foreach ($line in ($porcelain -split "`n")) {
            if (-not $line.Trim()) { continue }
            $path = $line.Substring(3).Trim().Trim('"')
            if (Test-SecretPath $path) { git reset HEAD -- $path 2>$null | Out-Null }
        }
        $after = git status --porcelain
        if (-not $after) { return $false }
        git commit -m $Message
        return ($LASTEXITCODE -eq 0)
    } finally {
        Pop-Location
    }
}

function Ensure-Remote {
    param(
        [string]$Root,
        [string]$RemoteUrl
    )
    Push-Location $Root
    try {
        git remote get-url origin 2>$null | Out-Null
        if ($LASTEXITCODE -ne 0) {
            git remote add origin $RemoteUrl
        } else {
            git remote set-url origin $RemoteUrl
        }
    } finally {
        Pop-Location
    }
}

function Enable-PagesWorkflow {
    param(
        [string]$Gh,
        [string]$Owner,
        [string]$Repo,
        [string]$Branch
    )
    $api = "repos/$Owner/$Repo/pages"
    Invoke-Gh $Gh api $api -X POST -f build_type=workflow 2>$null | Out-Null
    if ($LASTEXITCODE -ne 0) {
        Invoke-Gh $Gh api $api -X PUT -f build_type=workflow 2>$null | Out-Null
    }
    Invoke-Gh $Gh workflow run deploy-pages.yml --repo "$Owner/$Repo" --ref $Branch 2>$null | Out-Null
}

function Ensure-PublicRepo {
    param(
        [string]$Gh,
        [string]$Owner,
        [string]$Repo
    )
    $json = Invoke-Gh $Gh repo view "$Owner/$Repo" --json visibility 2>$null
    if ($LASTEXITCODE -ne 0) { return }
    if ($json -match '"PRIVATE"') {
        Invoke-Gh $Gh repo edit "$Owner/$Repo" --visibility public --accept-visibility-change-consequences 2>$null | Out-Null
    }
}
