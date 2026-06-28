# Herramientas del proyecto

Scripts de automatización para **Ghost Specialty Coffee**. El repositorio GitHub sigue llamándose `cotizador-viajes-peludos` por historial; el sitio es la web del café Ghost.

## Publicar (sin configuración manual)

| Entorno | Comando |
|---------|---------|
| Linux / Cloud Agent | `bash tools/automatizar-todo.sh` |
| Windows | `powershell -NoProfile -ExecutionPolicy Bypass -File tools/automatizar-todo.ps1` |

## Python

```bash
bash tools/setup-python.sh    # crea .venv e instala dependencias
source .venv/bin/activate
python tools/discover-tienda-foto.py
```

| Script | Uso |
|--------|-----|
| `discover-tienda-foto.py` | Elige y optimiza la mejor foto de tienda |
| `process_images.py` | Quita fondos (solo con `--force`; evitar en fotos oficiales) |

## Otros

| Script | Uso |
|--------|-----|
| `automatizar-tienda-foto.sh` | Sincroniza foto de tienda desde artefactos o incoming |
| `sync-firebase-config.sh` | Regenera `js/firebase-config.js` desde `deploy.config.json` |
| `crear-repo-ghost.sh` | Crea repo dedicado `ghost_coffee_shop` (opcional) |

## Configuración central

Todo vive en `deploy.config.json` en la raíz — URLs, Firebase, emails admin, PIN.
