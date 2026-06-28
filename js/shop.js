/**
 * @file Página tienda — catálogo y ubicaciones
 * @module shop
 */

import { listShops } from './data/store.js';
import { GhostProducts } from './products.js';
import { escapeHtml } from './utils.js';
import { BRAND } from './config.js';

export class GhostShop {
  async init() {
    await new GhostProducts('#ghostShopProducts', { layout: 'shop' }).init();
    await this.#renderLocations();
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
              <a href="${escapeHtml(BRAND.instagram)}" target="_blank" rel="noopener noreferrer">Instagram</a>
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

        return `
          <article class="ghost-shop-location">
            <h3 class="ghost-shop-location__name">${escapeHtml(shop.name)}</h3>
            <p class="ghost-shop-location__city">${escapeHtml(shop.city)}</p>
            <p class="ghost-shop-location__address">${escapeHtml(shop.address)}</p>
            <p class="ghost-shop-location__phone">${escapeHtml(shop.phone)}</p>
            <div class="ghost-shop-location__links">
              <a href="${escapeHtml(ig)}" target="_blank" rel="noopener noreferrer">Instagram</a>
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
