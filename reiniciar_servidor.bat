@echo off
title Reiniciar servidor — Viajes Peludos
cd /d "%~dp0"
echo.
echo  Reiniciando servidor en puerto 8765...
echo.

for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":8765" ^| findstr "LISTENING"') do (
  echo Cerrando proceso %%a en puerto 8765...
  taskkill /PID %%a /F >nul 2>&1
)

timeout /t 2 /nobreak >nul

set "PY=%LOCALAPPDATA%\Python\bin\python.exe"
if not exist "%PY%" set "PY=python"

echo Servidor: http://127.0.0.1:8765
echo Deja esta ventana ABIERTA.
echo.
"%PY%" -m http.server 8765
pause
