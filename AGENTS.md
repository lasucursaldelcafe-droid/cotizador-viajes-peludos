# AGENTS.md

## Cursor Cloud specific instructions

### Qué es este proyecto
Sitio web **estático** (HTML + CSS + JS vanilla) — el "Cotizador Viajes Peludos", un generador de cotizaciones para transporte internacional de mascotas. No hay build system, ni `package.json`, ni `node_modules`. Firebase (Auth + Firestore) se carga desde CDN (`gstatic.com`) en runtime. El despliegue de producción es GitHub Pages vía `.github/workflows/deploy-pages.yml`.

### Cómo correr (desarrollo)
No hay dependencias que instalar. Sirve la raíz del repo con cualquier servidor estático, p. ej.:

```
python3 -m http.server 8765
```

Luego abre `http://localhost:8765/index.html`. `localhost` está en los `authorizedDomains` de Firebase Auth (`firebase.json`).

- `index.html` = página de login (Google Sign-In con Firebase).
- `app.html` = editor del cotizador (vista previa en vivo + exportar a Word). **Está protegido por auth**: si no hay sesión iniciada, `js/vp-app-auth.js` redirige a `index.html`.

No abras los HTML con `file://`: el código detecta ese entorno como no soportado para auth y muestra error. Siempre usa un servidor HTTP.

### Gotcha de testing (importante)
El editor de `app.html` requiere iniciar sesión con una cuenta de Google real (popup OAuth de Firebase), que **no se puede automatizar** dentro de la VM. Para probar la funcionalidad core del editor (formulario → vista previa en vivo → exportar Word) sin Google, crea una página de prueba **temporal y no commiteada** que reutilice los mismos scripts de `js/` pero defina stubs de `VpAuth` y `VpAppAuth` (con `VpAppAuth.init()` devolviendo `true`) en lugar de cargar `js/vp-auth.js`, `js/vp-app-auth.js` y los SDK de Firebase. Bórrala al terminar. (No modifiques el código fuente real solo para testear.)

### Lint / Test / Build
No hay linters, suite de tests ni paso de build configurados en el repo. La validación es manual en el navegador. CI (`deploy-pages.yml`) solo regenera `js/firebase-config.js` desde `deploy.config.json` y publica a GitHub Pages.

### Config Firebase
La fuente de verdad de la config Firebase es `deploy.config.json`. CI genera `js/firebase-config.js` a partir de ella; los HTML también incluyen un bloque inline `window.VP_FIREBASE_CONFIG`. Los scripts `.ps1`/`.bat` en `tools/` son utilidades de despliegue para Windows y no son necesarios para correr el sitio localmente.
