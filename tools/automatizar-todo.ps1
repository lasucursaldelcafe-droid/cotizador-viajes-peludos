# Deploy automatico Ghost Specialty Coffee — GitHub Pages
param(
    [switch]$Recreate
)

$ErrorActionPreference = "Stop"

$deployArgs = @{}
if ($Recreate) { $deployArgs.Recreate = $true }
& "$PSScriptRoot\deploy-auto.ps1" @deployArgs
exit $LASTEXITCODE
