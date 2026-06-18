@echo off
chcp 65001 >nul
cd /d "%~dp0"

set GH=C:\Program Files\GitHub CLI\gh.exe

echo.
echo ============================================
echo  INICIAR SESION EN GITHUB (Viajes Peludos)
echo ============================================
echo.
echo Cuenta: lasucursaldelcafe-droid
echo.

if not exist "%GH%" (
    echo Instalando GitHub CLI...
    winget install --id GitHub.cli -e --accept-source-agreements --accept-package-agreements
)

echo Metodo recomendado: se abrira el NAVEGADOR automaticamente.
echo No necesitas copiar ningun codigo.
echo.
pause

"%GH%" auth login --hostname github.com --git-protocol https --web

"%GH%" auth status
if errorlevel 1 (
    echo.
    echo Si fallo el navegador, usa CODIGO manual:
    echo   1. Ejecuta de nuevo y elige "Paste an authentication token"
    echo   2. O crea token en: https://github.com/settings/tokens
    echo      Permisos: repo, workflow, read:org
    pause
    exit /b 1
)

echo.
echo Sesion OK. Ahora recreando el repositorio...
powershell -ExecutionPolicy Bypass -File "%~dp0tools\recrear-github.ps1"
echo.
pause
