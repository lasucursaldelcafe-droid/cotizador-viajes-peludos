# Ghost Specialty Coffee

Sitio estático de marca agresiva para **Ghost Specialty Coffee** — café de especialidad en Cali, Colombia.

Combina lo mejor de los ecosistemas **Más Café** (contenido editorial, microlotes, tipografía premium) y **La Sucursal del Café** (identidad cafetera, eventos, comunidad).

## URLs

- **Sitio:** https://lasucursaldelcafe-droid.github.io/ghost_coffee_shop/
- **Instagram:** [@ghost_specialty_coffee](https://www.instagram.com/ghost_specialty_coffee/)

## Estructura

```
content/site.json   — fuente única de contenido (marca, menú, productos)
css/ghost.css       — sistema visual agresivo (void, spectral, ember)
js/ghost-*.js       — configuración, contenido dinámico, navegación
index.html          — home con hero, marquee, experiencias, productos
menu.html           — carta de barra
origen.html         — microlotes y trazabilidad
nosotros.html       — manifiesto y valores
contacto.html       — ubicación, horarios, WhatsApp
deploy.config.json  — configuración central de deploy
```

## Desarrollo local

```bash
python3 -m http.server 8080
# Abrir http://localhost:8080
```

## Deploy

Push a `main` activa GitHub Pages vía `.github/workflows/deploy-pages.yml`.

Configuración central en `deploy.config.json`.

## Marca

| Token | Valor | Uso |
|-------|-------|-----|
| Void | `#08080a` | Fondo principal |
| Spectral | `#00e5b8` | Acento fosforescente |
| Ember | `#ff4d1a` | CTAs agresivos |
| Ghost | `#f0ede6` | Texto principal |

Tipografía: **Bebas Neue** (display), **Satoshi** (cuerpo), **Playfair Display** (editorial).
