/**
 * @file Catálogo público de productos de venta
 * @module products
 */

import { listProducts } from './data/store.js';
import { escapeHtml, formatCop } from './utils.js';

/**
 * Renderiza productos en #ghostProductsRoot
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

      this.#root.innerHTML = products.map((p) => `
        <article class="ghost-product ${p.featured ? 'ghost-product--featured' : ''}">
          ${p.imageUrl
            ? `<img class="ghost-product__img" src="${escapeHtml(p.imageUrl)}" alt="${escapeHtml(p.name)}" width="200" height="180" loading="lazy">`
            : ''}
          <h3 class="ghost-product__name">${escapeHtml(p.name)}</h3>
          <p class="ghost-product__meta">${escapeHtml(p.region)} · ${escapeHtml(p.roast || p.variety)}</p>
          ${p.notes?.length ? `<ul class="ghost-product__notes">${p.notes.map((n) => `<li class="ghost-product__tag">${escapeHtml(n)}</li>`).join('')}</ul>` : ''}
          <p class="ghost-product__price">${escapeHtml(formatCop(p.price))} <small>/ ${escapeHtml(p.weight)}</small></p>
        </article>
      `).join('');
    } catch (err) {
      console.error('GhostProducts:', err);
      this.#root.innerHTML = '<p class="ghost-products-empty">No pudimos cargar el catálogo.</p>';
    }
  }
}
