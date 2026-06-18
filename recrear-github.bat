@echo off
chcp 65001 >nul
cd /d "%~dp0"

set GH=C:\Program Files\GitHub CLI\gh.exe

echo.
echo === Recrear repo Cotizador Viajes Peludos ===
echo.

if not exist "%GH%" (
    echo [ERROR] GitHub CLI no instalada.
    pause
    exit /b 1
)

"%GH%" auth status >nul 2>&1
if errorlevel 1 (
    echo Inicia sesion en GitHub (cuenta lasucursaldelcafe-droid)...
    "%GH%" auth login
)

powershell -ExecutionPolicy Bypass -File "%~dp0tools\recrear-github.ps1"
echo.
pause
