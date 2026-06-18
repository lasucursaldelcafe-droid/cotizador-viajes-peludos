@echo off
powershell -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File "%~dp0tools\deploy-auto.ps1" -Recreate
exit /b %ERRORLEVEL%
