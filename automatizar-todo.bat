@echo off
powershell -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File "%~dp0tools\automatizar-todo.ps1" %*
exit /b %ERRORLEVEL%
