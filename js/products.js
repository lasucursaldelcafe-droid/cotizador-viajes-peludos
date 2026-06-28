/**
 * @file Catálogo público de productos de venta
 * @module products
 */

import { listProducts } from './data/store.js';
import { escapeHtml, formatCop } from './utils.js';
import { whatsappUrl } from './config.js';

/** @typedef {{ layout?: 'grid' | 'shop' }} ProductRenderOptions */

const DEFAULT_IMAGES = {
  papayo: 'assets/images/brand/product-bag-papayo.png',
  gesha: 'assets/images/brand/product-bag-papayo.png',
  bourbon: 'assets/images/brand/product-bag-papayo.png',
  default: 'assets/images/brand/product-cup-hot.png',
};

/** @param {import('./data/store.js').RetailProduct} product */
function resolveImage(product) {
  if (product.imageUrl) return product.imageUrl;
  const key = `${product.name} ${product.variety}`.toLowerCase();
  if (key.includes('papayo')) return DEFAULT_IMAGES.papayo;
  if (key.includes('gesha')) return DEFAULT_IMAGES.gesha;
  if (key.includes('bourbon')) return DEFAULT_IMAGES.bourbon;
  if (key.includes('castillo') || key.includes('caturra') || key.includes('valle')) return DEFAULT_IMAGES.papayo;
  return DEFAULT_IMAGES.default;
}

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

  /** @type {ProductRenderOptions} */
  #options;

  /**
   * @param {string} selector
   * @param {ProductRenderOptions} [options]
   */
  constructor(selector = '#ghostProductsRoot', options = {}) {
    this.#root = document.querySelector(selector);
    this.#options = options;
  }

  async init() {
    if (!this.#root) return;

    try {
      const products = await listProducts();
      if (!products.length) {
        this.#root.innerHTML = '<p class="ghost-products-empty">Próximamente nuevos lotes. Escríbenos por WhatsApp o configura productos en el <a href="admin.html">panel admin</a>.</p>';
        return;
      }

      const layout = this.#options.layout ?? 'grid';
      this.#root.innerHTML = products.map((p) =>
        layout === 'shop' ? this.#renderShopCard(p) : this.#renderGridCard(p)
      ).join('');
    } catch (err) {
      console.error('GhostProducts:', err);
      this.#root.innerHTML = '<p class="ghost-products-empty">No pudimos cargar el catálogo.</p>';
    }
  }

  /** @param {import('./data/store.js').RetailProduct} p */
  #priceLabel(p) {
    if (!p.price || p.price <= 0) return 'Consultar precio';
    return `${formatCop(p.price)} <small>/ ${escapeHtml(p.weight)}</small>`;
  }

  /** @param {import('./data/store.js').RetailProduct} p */
  #renderShopCard(p) {
    const img = resolveImage(p);
    const msg = p.price && p.price > 0
      ? `Hola Ghost, quiero pedir ${p.name} ${p.variety} (${p.weight}).`
      : `Hola Ghost, vi ${p.name} ${p.variety} (${p.weight}) en Instagram y quiero cotizar.`;
    const notes = p.notes?.length
      ? `<ul class="ghost-shop-card__notes">${p.notes.map((n) => `<li class="ghost-shop-card__tag">${escapeHtml(n)}</li>`).join('')}</ul>`
      : '';

    return `
      <article class="ghost-shop-card ${p.featured ? 'ghost-shop-card--featured' : ''}">
        <div class="ghost-shop-card__media">
          ${p.featured ? '<span class="ghost-shop-card__badge">Destacado</span>' : ''}
          <img src="${escapeHtml(img)}" alt="${escapeHtml(p.name)}" width="400" height="600" loading="lazy" decoding="async">
        </div>
        <div class="ghost-shop-card__body">
          <p class="ghost-shop-card__region">${escapeHtml(p.region)}</p>
          <h3 class="ghost-shop-card__name">${escapeHtml(p.name)}</h3>
          <p class="ghost-shop-card__meta">${escapeHtml(p.variety)} · ${escapeHtml(p.roast || '')}</p>
          ${notes}
          <div class="ghost-shop-card__footer">
            <p class="ghost-shop-card__price">${this.#priceLabel(p)}</p>
            <a class="ghost-shop-card__buy" href="${escapeHtml(whatsappUrl(msg))}" target="_blank" rel="noopener noreferrer">Pedir</a>
          </div>
        </div>
      </article>`;
  }

  /** @param {import('./data/store.js').RetailProduct} p */
  #renderGridCard(p) {
    const region = regionClass(p.region);
    const img = resolveImage(p);
    const notes = p.notes?.length
      ? `<ul class="ghost-product__notes">${p.notes.map((n) => `<li class="ghost-product__tag">${escapeHtml(n)}</li>`).join('')}</ul>`
      : '';

    return `
      <article class="ghost-product ${p.featured ? 'ghost-product--featured' : ''} ghost-product--${region}">
        <div class="ghost-product__visual ghost-product__visual--photo" aria-hidden="true">
          <img src="${escapeHtml(img)}" alt="" width="400" height="600" loading="lazy" decoding="async">
          <span class="ghost-product__region">${escapeHtml(p.region)}</span>
        </div>
        <h3 class="ghost-product__name">${escapeHtml(p.name)}</h3>
        <p class="ghost-product__meta">${escapeHtml(p.region)} · ${escapeHtml(p.roast || p.variety)}</p>
        ${notes}
        <p class="ghost-shop-card__price">${this.#priceLabel(p)}</p>
      </article>`;
  }
}
