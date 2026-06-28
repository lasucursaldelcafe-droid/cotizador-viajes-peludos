# Publicacion automatica completa - sin preguntas ni pausas
param(
    [switch]$Recreate
)

. "$PSScriptRoot\gh-lib.ps1"

try {
    $cfg = Get-DeployConfig
    $owner = $cfg.owner
    $repo = $cfg.repo
    $branch = if ($cfg.default_branch) { $cfg.default_branch } else { "main" }
    $pagesUrl = $cfg.pages_url
    $remoteUrl = "https://github.com/$owner/$repo.git"
    $root = Get-ProjectRoot

    $syncScript = Join-Path $root "tools\sync-firebase-config.ps1"
    if (Test-Path $syncScript) {
        & $syncScript | Out-Null
    }

    # Si el repo objetivo es ghost_coffee_shop, usar script bash dedicado
    if ($repo -eq "ghost_coffee_shop" -and (Test-Path (Join-Path $root "tools/crear-repo-ghost.sh"))) {
        $bash = Get-Command bash -ErrorAction SilentlyContinue
        if ($bash) {
            & bash (Join-Path $root "tools/crear-repo-ghost.sh")
            exit $LASTEXITCODE
        }
    }

    $gh = Ensure-GhInstalled
    if (-not (Ensure-GhToken -Gh $gh)) {
        Write-DeployStatus -Status auth_required -PagesUrl $pagesUrl -Message "Sin token GitHub. Ejecuta una vez: iniciar-github.bat o gh auth login"
        exit 10
    }

    Set-Location $root
    Ensure-Remote -Root $root -RemoteUrl $remoteUrl

    if ($Recreate) {
        Invoke-Gh $gh repo view "$owner/$repo" 2>$null | Out-Null
        if ($LASTEXITCODE -eq 0) {
            Invoke-Gh $gh repo delete "$owner/$repo" --yes 2>$null | Out-Null
            Start-Sleep -Seconds 2
            git remote remove origin 2>$null | Out-Null
        }
        [void](Commit-AllSafe -Root $root -Message "Publicar Ghost Specialty Coffee")
        Invoke-Gh $gh repo create $repo --public --description "Ghost Specialty Coffee — café de especialidad Cali" --source=. --remote=origin --push
        if ($LASTEXITCODE -ne 0) { throw "No se pudo crear el repositorio" }
    } else {
        [void](Commit-AllSafe -Root $root -Message "Actualizar Ghost Specialty Coffee")
        Invoke-Gh $gh repo view "$owner/$repo" 2>$null | Out-Null
        if ($LASTEXITCODE -ne 0) {
            Invoke-Gh $gh repo create $repo --public --source=. --remote=origin --push
            if ($LASTEXITCODE -ne 0) { throw "No se pudo crear el repositorio" }
        } else {
            $prev = $ErrorActionPreference
            $ErrorActionPreference = "Continue"
            git push -u origin $branch 2>&1 | Out-Null
            $pushOk = ($LASTEXITCODE -eq 0)
            $ErrorActionPreference = $prev
            if (-not $pushOk) { throw "git push fallo" }
        }
    }

    Ensure-PublicRepo -Gh $gh -Owner $owner -Repo $repo
    Enable-PagesWorkflow -Gh $gh -Owner $owner -Repo $repo -Branch $branch

    Write-DeployStatus -Status ok -PagesUrl $pagesUrl -Message "Publicado. Pages activo en 1-3 minutos."
    exit 0
} catch {
    if ($_.Exception.Message -match '409' -and $pagesUrl) {
        Write-DeployStatus -Status ok -PagesUrl $pagesUrl -Message "Publicado (Pages ya estaba activo)."
        exit 0
    }
    Write-DeployStatus -Status error -PagesUrl $pagesUrl -Message $_.Exception.Message
    exit 1
}
