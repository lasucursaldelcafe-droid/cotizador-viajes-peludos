/**
 * @file Dashboard admin — coffee shops y productos de venta
 * @module admin/dashboard
 */

import { currentEmail, logout, requireAuth } from './auth.js';
import {
  deleteProduct,
  deleteShop,
  isFirebaseReady,
  listAllProducts,
  listAllShops,
  saveProduct,
  saveShop,
} from '../data/store.js';
import { escapeHtml, formatCop } from '../utils.js';

class AdminDashboard {
  /** @type {'shops' | 'products'} */
  #tab = 'shops';

  /** @type {import('../data/store.js').CoffeeShop[]} */
  #shops = [];

  /** @type {import('../data/store.js').RetailProduct[]} */
  #products = [];

  async init() {
    requireAuth();
    this.#wireShell();
    await this.#refresh();
    this.#render();
  }

  #wireShell() {
    const email = currentEmail();
    const emailEl = document.querySelector('#adminUserEmail');
    if (emailEl && email) emailEl.textContent = email;

    document.querySelector('#adminLogout')?.addEventListener('click', () => {
      logout();
      globalThis.location.href = 'login.html';
    });

    document.querySelectorAll('[data-admin-tab]').forEach((btn) => {
      btn.addEventListener('click', () => {
        this.#tab = btn.dataset.adminTab;
        document.querySelectorAll('[data-admin-tab]').forEach((b) => {
          b.classList.toggle('admin-tab--active', b.dataset.adminTab === this.#tab);
          b.setAttribute('aria-selected', String(b.dataset.adminTab === this.#tab));
        });
        this.#render();
      });
    });

    document.querySelector('#adminNewShop')?.addEventListener('click', () => this.#openShopForm());
    document.querySelector('#adminNewProduct')?.addEventListener('click', () => this.#openProductForm());

    isFirebaseReady().then((ready) => {
      const badge = document.querySelector('#adminStorageBadge');
      if (badge) {
        badge.textContent = ready ? 'Firebase' : 'Local';
        badge.classList.toggle('admin-badge--firebase', ready);
      }
    });
  }

  async #refresh() {
    this.#shops = await listAllShops();
    this.#products = await listAllProducts();
  }

  #render() {
    const panel = document.querySelector('#adminPanel');
    if (!panel) return;

    panel.innerHTML = this.#tab === 'shops' ? this.#renderShops() : this.#renderProducts();
    this.#wirePanelActions();
  }

  #renderShops() {
    if (!this.#shops.length) {
      return `<p class="admin-empty">No hay coffee shops. Crea la primera.</p>`;
    }

    return `
      <div class="admin-table-wrap">
        <table class="admin-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Ciudad</th>
              <th>Teléfono</th>
              <th>Estado</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            ${this.#shops.map((s) => `
              <tr>
                <td><strong>${escapeHtml(s.name)}</strong><br><small>${escapeHtml(s.address)}</small></td>
                <td>${escapeHtml(s.city)}</td>
                <td>${escapeHtml(s.phone)}</td>
                <td><span class="admin-status ${s.active ? 'admin-status--on' : 'admin-status--off'}">${s.active ? 'Activa' : 'Inactiva'}</span></td>
                <td class="admin-actions">
                  <button type="button" class="admin-btn admin-btn--ghost" data-edit-shop="${escapeHtml(s.id)}">Editar</button>
                  <button type="button" class="admin-btn admin-btn--danger" data-del-shop="${escapeHtml(s.id)}">Eliminar</button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  #renderProducts() {
    if (!this.#products.length) {
      return `<p class="admin-empty">No hay productos de venta. Sube el primero.</p>`;
    }

    return `
      <div class="admin-product-grid">
        ${this.#products.map((p) => {
          const shop = this.#shops.find((s) => s.id === p.shopId);
          return `
            <article class="admin-product-card">
              ${p.imageUrl
            ? `<img class="admin-product-card__img" src="${escapeHtml(p.imageUrl)}" alt="${escapeHtml(p.name)}" loading="lazy">`
            : `<div class="admin-product-card__placeholder admin-product-card__placeholder--brand"><span>${escapeHtml(p.region)}</span></div>`}
              <div class="admin-product-card__body">
                <h3 class="admin-product-card__name">${escapeHtml(p.name)}</h3>
                <p class="admin-product-card__meta">${escapeHtml(p.region)} · ${escapeHtml(p.variety)}</p>
                <p class="admin-product-card__price">${escapeHtml(formatCop(p.price))} <small>/ ${escapeHtml(p.weight)}</small></p>
                <p class="admin-product-card__shop">${shop ? escapeHtml(shop.name) : '—'}</p>
                <div class="admin-product-card__actions">
                  <button type="button" class="admin-btn admin-btn--ghost" data-edit-product="${escapeHtml(p.id)}">Editar</button>
                  <button type="button" class="admin-btn admin-btn--danger" data-del-product="${escapeHtml(p.id)}">Eliminar</button>
                </div>
              </div>
            </article>
          `;
        }).join('')}
      </div>
    `;
  }

  #wirePanelActions() {
    document.querySelectorAll('[data-edit-shop]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const shop = this.#shops.find((s) => s.id === btn.dataset.editShop);
        if (shop) this.#openShopForm(shop);
      });
    });

    document.querySelectorAll('[data-del-shop]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        if (!confirm('¿Eliminar esta coffee shop y sus productos?')) return;
        await deleteShop(btn.dataset.delShop);
        await this.#refresh();
        this.#render();
      });
    });

    document.querySelectorAll('[data-edit-product]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const product = this.#products.find((p) => p.id === btn.dataset.editProduct);
        if (product) this.#openProductForm(product);
      });
    });

    document.querySelectorAll('[data-del-product]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        if (!confirm('¿Eliminar este producto?')) return;
        await deleteProduct(btn.dataset.delProduct);
        await this.#refresh();
        this.#render();
      });
    });
  }

  /**
   * @param {import('../data/store.js').CoffeeShop} [shop]
   */
  #openShopForm(shop) {
    const modal = document.querySelector('#adminModal');
    const body = document.querySelector('#adminModalBody');
    if (!modal || !body) return;

    body.innerHTML = `
      <h2 class="admin-modal__title">${shop ? 'Editar coffee shop' : 'Nueva coffee shop'}</h2>
      <form class="admin-form" id="shopForm">
        <label class="admin-field">
          <span>Nombre</span>
          <input name="name" required value="${escapeHtml(shop?.name ?? '')}">
        </label>
        <label class="admin-field">
          <span>Dirección</span>
          <input name="address" required value="${escapeHtml(shop?.address ?? '')}">
        </label>
        <label class="admin-field">
          <span>Ciudad</span>
          <input name="city" required value="${escapeHtml(shop?.city ?? 'Cali')}">
        </label>
        <label class="admin-field">
          <span>Teléfono</span>
          <input name="phone" required value="${escapeHtml(shop?.phone ?? '')}">
        </label>
        <label class="admin-field">
          <span>Instagram (sin @)</span>
          <input name="instagram" value="${escapeHtml(shop?.instagram ?? '')}">
        </label>
        <label class="admin-check">
          <input type="checkbox" name="active" ${shop?.active !== false ? 'checked' : ''}>
          <span>Activa</span>
        </label>
        <div class="admin-form__actions">
          <button type="button" class="admin-btn admin-btn--ghost" data-close-modal>Cancelar</button>
          <button type="submit" class="admin-btn admin-btn--primary">Guardar</button>
        </div>
      </form>
    `;

    modal.hidden = false;
    this.#wireModal();

    body.querySelector('#shopForm')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const name = String(fd.get('name'));
      await saveShop({
        id: shop?.id,
        name,
        slug: shop?.slug ?? name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
        address: String(fd.get('address')),
        city: String(fd.get('city')),
        phone: String(fd.get('phone')),
        instagram: String(fd.get('instagram') ?? ''),
        active: fd.get('active') === 'on',
      });
      this.#closeModal();
      await this.#refresh();
      this.#render();
    });
  }

  /**
   * @param {import('../data/store.js').RetailProduct} [product]
   */
  #openProductForm(product) {
    const modal = document.querySelector('#adminModal');
    const body = document.querySelector('#adminModalBody');
    if (!modal || !body) return;

    if (!this.#shops.length) {
      alert('Primero crea una coffee shop.');
      return;
    }

    const shopOptions = this.#shops.map((s) =>
      `<option value="${escapeHtml(s.id)}" ${product?.shopId === s.id ? 'selected' : ''}>${escapeHtml(s.name)}</option>`
    ).join('');

    body.innerHTML = `
      <h2 class="admin-modal__title">${product ? 'Editar producto' : 'Nuevo producto de venta'}</h2>
      <form class="admin-form" id="productForm">
        <label class="admin-field">
          <span>Coffee shop</span>
          <select name="shopId" required>${shopOptions}</select>
        </label>
        <label class="admin-field">
          <span>Nombre</span>
          <input name="name" required value="${escapeHtml(product?.name ?? '')}" placeholder="Ghost · Papayo">
        </label>
        <div class="admin-form__row">
          <label class="admin-field">
            <span>Variedad</span>
            <input name="variety" required value="${escapeHtml(product?.variety ?? '')}">
          </label>
          <label class="admin-field">
            <span>Región</span>
            <input name="region" required value="${escapeHtml(product?.region ?? '')}">
          </label>
        </div>
        <div class="admin-form__row">
          <label class="admin-field">
            <span>Precio (COP)</span>
            <input name="price" type="number" min="0" step="1000" required value="${product?.price ?? ''}">
          </label>
          <label class="admin-field">
            <span>Peso</span>
            <input name="weight" required value="${escapeHtml(product?.weight ?? '250 g')}">
          </label>
        </div>
        <label class="admin-field">
          <span>Tostión / proceso</span>
          <input name="roast" value="${escapeHtml(product?.roast ?? '')}">
        </label>
        <label class="admin-field">
          <span>Notas (separadas por coma)</span>
          <input name="notes" value="${escapeHtml((product?.notes ?? []).join(', '))}">
        </label>
        <label class="admin-field">
          <span>Imagen</span>
          <input type="file" name="image" accept="image/*">
          ${product?.imageUrl ? `<img class="admin-form__preview" src="${escapeHtml(product.imageUrl)}" alt="Vista previa">` : ''}
        </label>
        <label class="admin-check">
          <input type="checkbox" name="featured" ${product?.featured ? 'checked' : ''}>
          <span>Destacado</span>
        </label>
        <label class="admin-check">
          <input type="checkbox" name="active" ${product?.active !== false ? 'checked' : ''}>
          <span>Activo (visible en tienda)</span>
        </label>
        <div class="admin-form__actions">
          <button type="button" class="admin-btn admin-btn--ghost" data-close-modal>Cancelar</button>
          <button type="submit" class="admin-btn admin-btn--primary">Guardar producto</button>
        </div>
      </form>
    `;

    modal.hidden = false;
    this.#wireModal();

    body.querySelector('#productForm')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      let imageUrl = product?.imageUrl ?? '';
      const file = fd.get('image');
      if (file instanceof File && file.size > 0) {
        imageUrl = await this.#fileToDataUrl(file);
      }

      const notesRaw = String(fd.get('notes') ?? '');
      const notes = notesRaw.split(',').map((n) => n.trim()).filter(Boolean);

      await saveProduct({
        id: product?.id,
        shopId: String(fd.get('shopId')),
        name: String(fd.get('name')),
        variety: String(fd.get('variety')),
        region: String(fd.get('region')),
        price: Number(fd.get('price')),
        weight: String(fd.get('weight')),
        roast: String(fd.get('roast') ?? ''),
        notes,
        imageUrl,
        featured: fd.get('featured') === 'on',
        active: fd.get('active') === 'on',
      });

      this.#closeModal();
      await this.#refresh();
      this.#render();
    });
  }

  /**
   * @param {File} file
   * @returns {Promise<string>}
   */
  #fileToDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  #wireModal() {
    document.querySelectorAll('[data-close-modal]').forEach((btn) => {
      btn.addEventListener('click', () => this.#closeModal());
    });
    document.querySelector('.admin-modal__backdrop')?.addEventListener('click', () => this.#closeModal());
  }

  #closeModal() {
    const modal = document.querySelector('#adminModal');
    if (modal) modal.hidden = true;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new AdminDashboard().init();
});
