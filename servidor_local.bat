@echo off
title Viajes Peludos — Cotizador Web
cd /d "%~dp0"
echo.
echo  Cotizador Viajes Peludos
echo  http://localhost:8765
echo.
echo  Abre esa URL en Chrome o Edge.
echo  Deja esta ventana abierta. Ctrl+C para cerrar.
echo.

set "PY="
if exist "%LOCALAPPDATA%\Python\bin\python.exe" set "PY=%LOCALAPPDATA%\Python\bin\python.exe"
if not defined PY where python >nul 2>&1 && set "PY=python"
if not defined PY where py >nul 2>&1 && set "PY=py"

if defined PY (
  echo Usando Python: %PY%
  "%PY%" -m http.server 8765
  goto :fin
)

where node >nul 2>&1
if %errorlevel% equ 0 (
  echo Python no encontrado. Usando Node...
  npx --yes serve -l 8765 .
  goto :fin
)

echo.
echo ERROR: No hay servidor disponible.
echo Instala Python desde https://www.python.org/downloads/
echo o ejecuta manualmente:
echo   npx serve -l 8765 .
echo.
pause
exit /b 1

:fin
pause
