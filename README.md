# Ghost Specialty Coffee

Sitio estático **HTML + CSS + JavaScript** para Ghost Specialty Coffee — café de especialidad en Cali.

Stack puro, sin frameworks. CSS modular con `@layer`, `@property`, `color-mix`, container queries y scroll-driven animations. JavaScript ES modules con clases privadas.

> **Nota:** el repositorio GitHub se llama `cotizador-viajes-peludos` por historial del proyecto; el contenido y la marca son Ghost Specialty Coffee.

## Estructura

```
index.html          Home — hero, stats, experiencias, productos
menu.html           Carta de barra
origen.html         Microlotes y trazabilidad
nosotros.html       Manifiesto y valores
contacto.html       Ubicación y WhatsApp
admin.html          Panel admin (PIN local / Firebase opcional)

css/                Estilos modulares (@layer, tokens, componentes)
js/                 ES modules (nav, shop, admin, firebase-config)
content/            JSON de menú, sitio, estrategia, Instagram
tools/              Automatización deploy, Python, Firebase sync
deploy.config.json  Configuración central (URLs, Firebase, admin)
```

## Desarrollo local

```bash
python3 -m http.server 8080
# http://localhost:8080
```

> Los ES modules requieren servidor HTTP (no `file://`).

### Herramientas Python

```bash
bash tools/setup-python.sh
source .venv/bin/activate
```

Ver `tools/README.md` para scripts disponibles.

## Publicar

```bash
# Linux / Cloud Agent
bash tools/automatizar-todo.sh

# Windows
powershell -NoProfile -ExecutionPolicy Bypass -File tools/automatizar-todo.ps1
```

**Sitio en vivo:** https://lasucursaldelcafe-droid.github.io/cotizador-viajes-peludos/

Push a `main` activa GitHub Pages vía `.github/workflows/deploy-pages.yml`.

## Tecnologías

| Capa | Features |
|------|----------|
| **HTML5** | Semántica, JSON-LD, `aria-*`, `loading="lazy"` |
| **CSS** | `@layer`, `@property`, `color-mix`, `container-type`, `dvh`, scroll-driven animations |
| **JS** | ES modules, private fields `#`, `IntersectionObserver`, `Intl.NumberFormat` |

## Repo dedicado (opcional)

Para crear un repositorio separado `ghost_coffee_shop`:

```bash
bash tools/crear-repo-ghost.sh   # requiere gh auth login
```
