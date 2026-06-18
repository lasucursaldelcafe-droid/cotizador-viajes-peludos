@echo off
title Configurar Google — Firebase
cd /d "%~dp0"
echo.
echo  1) Inicia sesion en Firebase (se abrira el navegador)
echo  2) Despliega dominios autorizados + reglas Firestore
echo.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0tools\configurar-google.ps1"
pause
