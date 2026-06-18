# Todo automatico: Firebase config + reglas + GitHub Pages
param(
    [switch]$Recreate
)

$ErrorActionPreference = "Stop"
. "$PSScriptRoot\sync-firebase-config.ps1"
. "$PSScriptRoot\firebase-deploy-rules.ps1"

$deployArgs = @{}
if ($Recreate) { $deployArgs.Recreate = $true }
& "$PSScriptRoot\deploy-auto.ps1" @deployArgs
exit $LASTEXITCODE
