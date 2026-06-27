/**
 * @file Catálogo público de productos de venta
 * @module products
 */

import { listProducts } from './data/store.js';
import { escapeHtml, formatCop } from './utils.js';

/** @param {string} region */
function regionClass(region) {
  const key = region
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z]/g, '');
  return ['huila', 'narino', 'cauca', 'tolima'].includes(key) ? key : 'huila';
}

/**
 * Renderiza productos en el contenedor indicado
 */
export class GhostProducts {
  /** @type {HTMLElement | null} */
  #root = null;

  constructor(selector = '#ghostProductsRoot') {
    this.#root = document.querySelector(selector);
  }

  async init() {
    if (!this.#root) return;

    try {
      const products = await listProducts();
      if (!products.length) {
        this.#root.innerHTML = '<p class="ghost-products-empty">Próximamente nuevos lotes. Escríbenos por WhatsApp.</p>';
        return;
      }

      this.#root.innerHTML = products.map((p) => {
        const region = regionClass(p.region);
        return `
        <article class="ghost-product ${p.featured ? 'ghost-product--featured' : ''} ghost-product--${region}">
          <div class="ghost-product__visual" aria-hidden="true">
            <svg class="ghost-product__glyph" viewBox="0 0 64 64"><use href="assets/icons/glyphs.svg#glyph-beans"/></svg>
            <span class="ghost-product__region">${escapeHtml(p.region)}</span>
          </div>
          <h3 class="ghost-product__name">${escapeHtml(p.name)}</h3>
          <p class="ghost-product__meta">${escapeHtml(p.region)} · ${escapeHtml(p.roast || p.variety)}</p>
          ${p.notes?.length ? `<ul class="ghost-product__notes">${p.notes.map((n) => `<li class="ghost-product__tag">${escapeHtml(n)}</li>`).join('')}</ul>` : ''}
          <p class="ghost-product__price">${escapeHtml(formatCop(p.price))} <small>/ ${escapeHtml(p.weight)}</small></p>
        </article>
      `;
      }).join('');
    } catch (err) {
      console.error('GhostProducts:', err);
      this.#root.innerHTML = '<p class="ghost-products-empty">No pudimos cargar el catálogo.</p>';
    }
  }
}
