/**
 * @file Página tienda — catálogo, ubicaciones y guía Instagram
 * @module shop
 */

import { listShops } from './data/store.js';
import { GhostProducts } from './products.js';
import { escapeHtml } from './utils.js';
import { BRAND, asset } from './config.js';

/** @typedef {{ step: number; title: string; text: string }} InstagramGuideStep */
/** @typedef {{ id: string; title: string; description: string; varieties: string[]; weight?: string }} InstagramPostTheme */

export class GhostShop {
  async init() {
    await new GhostProducts('#ghostShopProducts', { layout: 'shop' }).init();
    await Promise.all([this.#renderLocations(), this.#renderInstagramGuide()]);
    this.#scrollFromInstagram();
  }

  #scrollFromInstagram() {
    const { hash } = globalThis.location ?? {};
    if (hash === '#desde-instagram') {
      document.querySelector('#desde-instagram')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  async #renderInstagramGuide() {
    const root = document.querySelector('#ghostShopInstagram');
    const intro = document.querySelector('#ghostShopInstagramIntro');
    if (!root) return;

    try {
      const res = await fetch(asset('content/instagram.json'));
      if (!res.ok) throw new Error('instagram.json');
      const data = await res.json();

      if (intro && data.bioSummary) {
        intro.textContent = data.bioSummary;
      }

      const steps = /** @type {InstagramGuideStep[]} */ (data.guide ?? []);
      const themes = /** @type {InstagramPostTheme[]} */ (data.postThemes ?? []);
      const profileUrl = data.url ?? BRAND.instagram;
      const handle = data.displayHandle ?? BRAND.instagramHandle;

      root.innerHTML = `
        <div class="ghost-shop-instagram__layout">
          <div class="ghost-shop-instagram__profile">
            <p class="ghost-shop-instagram__handle">
              <a href="${escapeHtml(profileUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(handle)}</a>
            </p>
            <p class="ghost-shop-instagram__bio">${escapeHtml(data.bioSummary ?? '')}</p>
            <a class="btn btn--ember ghost-shop-instagram__profile-btn" href="${escapeHtml(profileUrl)}" target="_blank" rel="noopener noreferrer">Abrir Instagram</a>
          </div>
          <ol class="ghost-shop-instagram__steps">
            ${steps.map((s) => `
              <li class="ghost-shop-instagram__step">
                <span class="ghost-shop-instagram__step-num" aria-hidden="true">${s.step}</span>
                <div>
                  <h3 class="ghost-shop-instagram__step-title">${escapeHtml(s.title)}</h3>
                  <p class="ghost-shop-instagram__step-text">${escapeHtml(s.text)}</p>
                </div>
              </li>`).join('')}
          </ol>
        </div>
        ${themes.length ? `
          <div class="ghost-shop-instagram__themes">
            <h3 class="ghost-shop-instagram__themes-title">Qué encontrarás en los posts</h3>
            <div class="ghost-shop-instagram__theme-grid">
              ${themes.map((t) => `
                <article class="ghost-shop-instagram__theme">
                  <h4>${escapeHtml(t.title)}</h4>
                  <p>${escapeHtml(t.description)}</p>
                  ${t.varieties?.length ? `<p class="ghost-shop-instagram__varieties">${t.varieties.map((v) => `<span>${escapeHtml(v)}</span>`).join('')}</p>` : ''}
                </article>`).join('')}
            </div>
          </div>` : ''}
        <p class="ghost-shop-instagram__return">
          <strong>Enlace en la bio:</strong> configura en Instagram la URL de esta tienda
          (<code>${escapeHtml(BRAND.siteUrl)}tienda.html#desde-instagram</code>)
          para que quien vea un post pueda volver al catálogo con un toque.
        </p>`;
    } catch (err) {
      console.error('GhostShop instagram:', err);
      root.innerHTML = `
        <p class="ghost-products-empty">
          Sigue <a href="${escapeHtml(BRAND.instagram)}" target="_blank" rel="noopener noreferrer">${escapeHtml(BRAND.instagramHandle)}</a>
          para ver lotes y usa el enlace de la bio para volver a esta tienda.
        </p>`;
    }
  }

  async #renderLocations() {
    const root = document.querySelector('#ghostShopLocations');
    if (!root) return;

    try {
      const shops = await listShops();
      if (!shops.length) {
        root.innerHTML = `
          <article class="ghost-shop-location">
            <h3 class="ghost-shop-location__name">${escapeHtml(BRAND.fullName)}</h3>
            <p class="ghost-shop-location__city">${escapeHtml(BRAND.city)}</p>
            <p class="ghost-shop-location__address">${escapeHtml(BRAND.address)}</p>
            <p class="ghost-shop-location__phone">${escapeHtml(BRAND.phone)}</p>
            <div class="ghost-shop-location__links">
              <a href="${escapeHtml(BRAND.instagram)}" target="_blank" rel="noopener noreferrer">${escapeHtml(BRAND.instagramHandle)}</a>
              <a href="contacto.html">Contacto</a>
            </div>
          </article>`;
        return;
      }

      root.innerHTML = shops.map((shop) => {
        const ig = shop.instagram
          ? (shop.instagram.startsWith('http')
            ? shop.instagram
            : `https://www.instagram.com/${shop.instagram.replace('@', '')}/`)
          : BRAND.instagram;

        const handle = shop.instagram?.startsWith('http')
          ? BRAND.instagramHandle
          : `@${(shop.instagram ?? 'ghost_specialty_coffee').replace('@', '')}`;

        return `
          <article class="ghost-shop-location">
            <h3 class="ghost-shop-location__name">${escapeHtml(shop.name)}</h3>
            <p class="ghost-shop-location__city">${escapeHtml(shop.city)}</p>
            <p class="ghost-shop-location__address">${escapeHtml(shop.address)}</p>
            <p class="ghost-shop-location__phone">${escapeHtml(shop.phone)}</p>
            <div class="ghost-shop-location__links">
              <a href="${escapeHtml(ig)}" target="_blank" rel="noopener noreferrer">${escapeHtml(handle)}</a>
              <a href="contacto.html">Cómo llegar</a>
            </div>
          </article>`;
      }).join('');
    } catch (err) {
      console.error('GhostShop locations:', err);
      root.innerHTML = '<p class="ghost-products-empty">No pudimos cargar las ubicaciones.</p>';
    }
  }
}
