# Ghost Specialty Coffee

Sitio estático **HTML + CSS + JavaScript** para Ghost Specialty Coffee — café de especialidad en Cali.

Stack puro, sin frameworks. CSS modular con `@layer`, `@property`, `color-mix`, container queries y scroll-driven animations. JavaScript ES modules con clases privadas.

## Estructura

```
index.html          Home — hero, stats, experiencias, productos
menu.html           Carta de barra
origen.html         Microlotes y trazabilidad
nosotros.html       Manifiesto y valores
contacto.html       Ubicación y WhatsApp

css/
  ghost.css         Entry point (@import modular)
  tokens.css        @property, variables, color-mix
  base.css          Reset, tipografía, grain
  layout.css        Grid, container queries, split
  components.css    Nav, hero, cards, menú, footer
  animations.css    Keyframes, scroll-timeline, reduced-motion

js/
  main.js           Entry point (type="module")
  config.js         BRAND, asset(), whatsappUrl()
  nav.js            class GhostNavigation
  reveal.js         class ScrollReveal (fallback IO)
  utils.js          formatCop, debounce, $
```

## Desarrollo local

```bash
python3 -m http.server 8080
# http://localhost:8080
```

> Los ES modules requieren servidor HTTP (no `file://`).

## Tecnologías avanzadas usadas

| Capa | Features |
|------|----------|
| **HTML5** | Semántica, JSON-LD, `aria-*`, `loading="lazy"` |
| **CSS** | `@layer`, `@property`, `color-mix`, `container-type`, `dvh`, logical properties, `text-wrap: balance/pretty`, scroll-driven animations |
| **JS** | ES modules, private fields `#`, `Object.freeze`, `IntersectionObserver`, `Intl.NumberFormat`, `debounce` |

## Deploy

### Crear repositorio nuevo (primera vez)

El proyecto está configurado para `lasucursaldelcafe-droid/ghost_coffee_shop`.

```bash
# Con GitHub CLI autenticado (permiso crear repos):
bash tools/crear-repo-ghost.sh
```

O en Windows: `tools\crear-repo-ghost.bat`

**URL del sitio:** https://lasucursaldelcafe-droid.github.io/ghost_coffee_shop/

Push a `main` activa GitHub Pages vía `.github/workflows/deploy-pages.yml`.
