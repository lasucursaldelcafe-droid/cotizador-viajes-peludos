@echo off
chcp 65001 >nul
setlocal EnableDelayedExpansion

cd /d "%~dp0"
set REPO=cotizador-viajes-peludos

echo.
echo  === Publicar Cotizador Viajes Peludos en GitHub Pages ===
echo.

where git >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Git no esta instalado.
    pause
    exit /b 1
)

set /p GH_USER="Usuario de GitHub (ej: juanperez): "
if "%GH_USER%"=="" (
    echo [ERROR] Debes escribir tu usuario de GitHub.
    pause
    exit /b 1
)

set REMOTE_URL=https://github.com/%GH_USER%/%REPO%.git
set PAGES_URL=https://%GH_USER%.github.io/%REPO%/

where gh >nul 2>&1
if not errorlevel 1 (
    echo.
    echo GitHub CLI detectado. Iniciando sesion si hace falta...
    gh auth status >nul 2>&1
    if errorlevel 1 gh auth login

    git remote get-url origin >nul 2>&1
    if errorlevel 1 (
        echo Creando repositorio y subiendo...
        gh repo create %REPO% --public --source=. --remote=origin --push
    ) else (
        echo Remoto ya existe. Subiendo cambios...
        git push -u origin main
    )
    goto :pages
)

echo.
echo GitHub CLI no instalado. Sigue estos pasos:
echo.
echo  1. Abre: https://github.com/new
echo  2. Nombre del repo: %REPO%
echo  3. Publico, SIN README ni .gitignore
echo  4. Clic en "Create repository"
echo.
pause

git remote get-url origin >nul 2>&1
if errorlevel 1 (
    git remote add origin %REMOTE_URL%
    echo Remoto agregado: %REMOTE_URL%
) else (
    echo Remoto origin ya configurado.
)

echo Subiendo a GitHub...
git push -u origin main
if errorlevel 1 (
    echo.
    echo [ERROR] No se pudo subir. Verifica usuario, contrasena o token.
    echo Ayuda: https://docs.github.com/es/authentication
    pause
    exit /b 1
)

:pages
echo.
echo  === Subida correcta ===
echo.
echo  Activa GitHub Pages:
echo    Repo -^> Settings -^> Pages
echo    Source: Deploy from a branch
echo    Branch: main  /  Folder: / (root)
echo.
echo  URL en el celular:
echo    %PAGES_URL%
echo.
pause
