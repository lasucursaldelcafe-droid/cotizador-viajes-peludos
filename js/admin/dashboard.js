/**
 * @file Dashboard admin — modelo Más Café para Ghost
 * @module admin/dashboard
 */

import { currentEmail, isAuthenticated, loginLocal, logout } from './auth.js';
import {
  deleteProduct,
  deleteShop,
  getBrandSettings,
  getMenuData,
  isFirebaseReady,
  listAllProducts,
  listAllShops,
  saveBrandSettings,
  saveMenuData,
  saveProduct,
  saveShop,
} from '../data/store.js';
import { escapeHtml, formatCop } from '../utils.js';

const PANELS = [
  { id: 'overview', label: 'Resumen', icon: '◉', subtitle: 'Vista general del sitio y la tienda' },
  { id: 'shops', label: 'Coffee shops', icon: '⌂', subtitle: 'Ubicaciones y datos de contacto' },
  { id: 'products', label: 'Café / Tienda', icon: '☕', subtitle: 'Productos de venta en la tienda pública' },
  { id: 'menu', label: 'Menú coffee shop', icon: '≡', subtitle: 'Carta, precios e ingredientes' },
  { id: 'brand', label: 'Marca y contacto', icon: '◇', subtitle: 'Textos principales y redes' },
];

class AdminDashboard {
  /** @type {string} */
  #panel = 'overview';

  /** @type {import('../data/store.js').CoffeeShop[]} */
  #shops = [];

  /** @type {import('../data/store.js').RetailProduct[]} */
  #products = [];

  /** @type {object | null} */
  #menu = null;

  async init() {
    this.#wireLogin();
    if (!isAuthenticated()) return;
    this.#showApp();
    this.#buildNav();
    this.#wireShell();
    await this.#refresh();
    this.#render();
  }

  #wireLogin() {
    const form = document.querySelector('#adminLoginForm');
    form?.addEventListener('submit', (e) => {
      e.preventDefault();
      const fd = new FormData(form);
      const user = String(fd.get('user') ?? '');
      const pin = String(fd.get('pin') ?? '');
      const error = document.querySelector('#loginError');
      if (loginLocal(user, pin)) {
        globalThis.location.reload();
        return;
      }
      if (error) {
        error.hidden = false;
        error.textContent = 'Usuario o contraseña incorrectos.';
      }
    });

    if (isAuthenticated()) this.#showApp();
  }

  #showApp() {
    document.body.classList.add('admin-authed');
    document.querySelector('#login-screen')?.classList.add('hidden');
    document.querySelector('#app')?.classList.remove('hidden');
  }

  #buildNav() {
    const nav = document.querySelector('#sidebarNav');
    if (!nav) return;
    nav.innerHTML = PANELS.map((p) =>
      `<button type="button" class="admin-nav-btn${p.id === this.#panel ? ' admin-nav-btn--active' : ''}" data-panel="${p.id}">${p.icon} ${p.label}</button>`
    ).join('');
    nav.querySelectorAll('[data-panel]').forEach((btn) => {
      btn.addEventListener('click', () => {
        this.#panel = btn.dataset.panel ?? 'overview';
        this.#buildNav();
        this.#render();
      });
    });
  }

  #wireShell() {
    const email = currentEmail();
    const emailEl = document.querySelector('#adminUserEmail');
    if (emailEl && email) emailEl.textContent = email;

    document.querySelector('#adminLogout')?.addEventListener('click', () => {
      logout();
      globalThis.location.reload();
    });

    document.querySelector('#adminPreviewSite')?.addEventListener('click', () => {
      globalThis.open('tienda.html', '_blank');
    });

    isFirebaseReady().then((ready) => {
      const badge = document.querySelector('#adminStorageBadge');
      if (badge) {
        badge.textContent = ready ? 'Sincronización: Firebase' : 'Almacenamiento: local';
        badge.classList.toggle('admin-sidebar__status--cloud', ready);
      }
    });
  }

  async #refresh() {
    this.#shops = await listAllShops();
    this.#products = await listAllProducts();
    this.#menu = await getMenuData();
  }

  #render() {
    const meta = PANELS.find((p) => p.id === this.#panel) ?? PANELS[0];
    const title = document.querySelector('#panelTitle');
    const subtitle = document.querySelector('#panelSubtitle');
    const actions = document.querySelector('#panelActions');
    const root = document.querySelector('#panelRoot');
    if (!root) return;

    if (title) title.textContent = meta.label;
    if (subtitle) subtitle.textContent = meta.subtitle;

    if (actions) {
      actions.innerHTML = this.#panel === 'shops'
        ? '<button type="button" class="admin-btn admin-btn--primary" id="adminNewShop">+ Nueva coffee shop</button>'
        : this.#panel === 'products'
          ? '<button type="button" class="admin-btn admin-btn--primary" id="adminNewProduct">+ Nuevo producto</button>'
          : this.#panel === 'menu'
            ? '<button type="button" class="admin-btn admin-btn--primary" id="adminSaveMenu">Guardar menú</button>'
            : this.#panel === 'brand'
              ? '<button type="button" class="admin-btn admin-btn--primary" id="adminSaveBrand">Guardar cambios</button>'
              : '<a class="admin-btn admin-btn--ghost" href="tienda.html" target="_blank" rel="noopener">Ver tienda</a>';
    }

    switch (this.#panel) {
      case 'overview':
        root.innerHTML = this.#renderOverview();
        break;
      case 'shops':
        root.innerHTML = this.#renderShops();
        this.#wireShopActions();
        document.querySelector('#adminNewShop')?.addEventListener('click', () => this.#openShopForm());
        break;
      case 'products':
        root.innerHTML = this.#renderProducts();
        this.#wireProductActions();
        document.querySelector('#adminNewProduct')?.addEventListener('click', () => this.#openProductForm());
        break;
      case 'menu':
        root.innerHTML = this.#renderMenu();
        document.querySelector('#adminSaveMenu')?.addEventListener('click', () => this.#saveMenuFromForm());
        break;
      case 'brand':
        root.innerHTML = this.#renderBrand();
        document.querySelector('#adminSaveBrand')?.addEventListener('click', () => this.#saveBrandFromForm());
        break;
      default:
        root.innerHTML = '';
    }
  }

  #renderOverview() {
    const activeProducts = this.#products.filter((p) => p.active).length;
    const activeShops = this.#shops.filter((s) => s.active).length;
    const menuSections = this.#menu?.sections?.length ?? 0;

    return `
      <div class="admin-cards">
        <article class="admin-card">
          <p class="admin-card__label">Coffee shops activas</p>
          <p class="admin-card__value">${activeShops}</p>
        </article>
        <article class="admin-card">
          <p class="admin-card__label">Productos en tienda</p>
          <p class="admin-card__value">${activeProducts}</p>
        </article>
        <article class="admin-card">
          <p class="admin-card__label">Secciones del menú</p>
          <p class="admin-card__value">${menuSections}</p>
        </article>
      </div>
      <div class="admin-card admin-card--wide">
        <h2 class="admin-card__title">Accesos rápidos</h2>
        <ul class="admin-quick-links">
          <li><a href="tienda.html" target="_blank" rel="noopener">Tienda pública</a></li>
          <li><a href="menu.html" target="_blank" rel="noopener">Menú coffee shop</a></li>
          <li><a href="index.html" target="_blank" rel="noopener">Página de inicio</a></li>
        </ul>
        <p class="admin-card__hint">Los cambios en productos y menú se guardan al instante en este navegador. Configura Firebase en <code>deploy.config.json</code> para sincronizar en la nube.</p>
      </div>`;
  }

  #renderShops() {
    if (!this.#shops.length) {
      return `<p class="admin-empty">No hay coffee shops. Crea la primera con el botón superior.</p>`;
    }

    return `
      <div class="admin-table-wrap">
        <table class="admin-table">
          <thead>
            <tr><th>Nombre</th><th>Ciudad</th><th>Teléfono</th><th>Estado</th><th></th></tr>
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
              </tr>`).join('')}
          </tbody>
        </table>
      </div>`;
  }

  #renderProducts() {
    if (!this.#products.length) {
      return `<p class="admin-empty">No hay productos. Sube el primero con el botón superior.</p>`;
    }

    return `
      <div class="admin-product-grid">
        ${this.#products.map((p) => {
          const shop = this.#shops.find((s) => s.id === p.shopId);
          return `
            <article class="admin-product-card">
              ${p.imageUrl
                ? `<img class="admin-product-card__img" src="${escapeHtml(p.imageUrl)}" alt="${escapeHtml(p.name)}" loading="lazy">`
                : '<div class="admin-product-card__placeholder">Sin imagen</div>'}
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
            </article>`;
        }).join('')}
      </div>`;
  }

  #renderMenu() {
    const sections = this.#menu?.sections ?? [];
    if (!sections.length) return '<p class="admin-empty">No hay secciones en el menú.</p>';

    return `
      <p class="admin-panel-intro">Edita nombres y precios. Los ingredientes se mantienen del archivo base; guarda para publicar en <a href="menu.html" target="_blank" rel="noopener">menu.html</a>.</p>
      <form id="menuAdminForm">
        ${sections.map((section, si) => `
          <section class="admin-menu-section">
            <h3 class="admin-menu-section__title">${escapeHtml(section.name)}</h3>
            ${section.items.map((item, ii) => `
              <div class="admin-menu-item">
                <label class="admin-field admin-field--grow">
                  <span>Plato</span>
                  <input name="item_${si}_${ii}_name" value="${escapeHtml(item.name)}" required>
                </label>
                <label class="admin-field admin-field--price">
                  <span>Precio COP</span>
                  <input name="item_${si}_${ii}_price" type="number" min="0" step="500" value="${Number(item.price)}" required>
                </label>
              </div>`).join('')}
          </section>`).join('')}
      </form>`;
  }

  #renderBrand() {
    const b = getBrandSettings();
    return `
      <form id="brandAdminForm" class="admin-form admin-form--card">
        <label class="admin-field"><span>Tagline</span><input name="tagline" value="${escapeHtml(b.tagline)}"></label>
        <label class="admin-field"><span>Titular principal</span><input name="headline" value="${escapeHtml(b.headline)}"></label>
        <label class="admin-field"><span>Teléfono</span><input name="phone" value="${escapeHtml(b.phone)}"></label>
        <label class="admin-field"><span>Correo</span><input name="email" type="email" value="${escapeHtml(b.email)}"></label>
        <label class="admin-field"><span>Instagram (sin @)</span><input name="instagram" value="${escapeHtml(b.instagram)}"></label>
        <label class="admin-field"><span>Dirección</span><input name="address" value="${escapeHtml(b.address)}"></label>
        <label class="admin-field"><span>Horarios</span><input name="hours" value="${escapeHtml(b.hours)}"></label>
      </form>`;
  }

  #wireShopActions() {
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
  }

  #wireProductActions() {
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

  async #saveMenuFromForm() {
    const form = document.querySelector('#menuAdminForm');
    if (!form || !this.#menu) return;
    const fd = new FormData(form);
    const menu = structuredClone(this.#menu);
    menu.sections.forEach((section, si) => {
      section.items.forEach((item, ii) => {
        item.name = String(fd.get(`item_${si}_${ii}_name`) ?? item.name);
        item.price = Number(fd.get(`item_${si}_${ii}_price`) ?? item.price);
      });
    });
    saveMenuData(menu);
    this.#menu = menu;
    alert('Menú guardado. Recarga menu.html para ver los cambios.');
  }

  #saveBrandFromForm() {
    const form = document.querySelector('#brandAdminForm');
    if (!form) return;
    const fd = new FormData(form);
    saveBrandSettings({
      tagline: String(fd.get('tagline') ?? ''),
      headline: String(fd.get('headline') ?? ''),
      phone: String(fd.get('phone') ?? ''),
      email: String(fd.get('email') ?? ''),
      instagram: String(fd.get('instagram') ?? ''),
      address: String(fd.get('address') ?? ''),
      hours: String(fd.get('hours') ?? ''),
    });
    alert('Marca y contacto guardados.');
  }

  /** @param {import('../data/store.js').CoffeeShop} [shop] */
  #openShopForm(shop) {
    const modal = document.querySelector('#adminModal');
    const body = document.querySelector('#adminModalBody');
    if (!modal || !body) return;

    body.innerHTML = `
      <h2 class="admin-modal__title">${shop ? 'Editar coffee shop' : 'Nueva coffee shop'}</h2>
      <form class="admin-form" id="shopForm">
        <label class="admin-field"><span>Nombre</span><input name="name" required value="${escapeHtml(shop?.name ?? '')}"></label>
        <label class="admin-field"><span>Dirección</span><input name="address" required value="${escapeHtml(shop?.address ?? '')}"></label>
        <label class="admin-field"><span>Ciudad</span><input name="city" required value="${escapeHtml(shop?.city ?? 'Cali')}"></label>
        <label class="admin-field"><span>Teléfono</span><input name="phone" required value="${escapeHtml(shop?.phone ?? '')}"></label>
        <label class="admin-field"><span>Instagram (sin @)</span><input name="instagram" value="${escapeHtml(shop?.instagram ?? '')}"></label>
        <label class="admin-check"><input type="checkbox" name="active" ${shop?.active !== false ? 'checked' : ''}><span>Activa</span></label>
        <div class="admin-form__actions">
          <button type="button" class="admin-btn admin-btn--ghost" data-close-modal>Cancelar</button>
          <button type="submit" class="admin-btn admin-btn--primary">Guardar</button>
        </div>
      </form>`;

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

  /** @param {import('../data/store.js').RetailProduct} [product] */
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
      <h2 class="admin-modal__title">${product ? 'Editar producto' : 'Nuevo producto'}</h2>
      <form class="admin-form" id="productForm">
        <label class="admin-field"><span>Coffee shop</span><select name="shopId" required>${shopOptions}</select></label>
        <label class="admin-field"><span>Nombre</span><input name="name" required value="${escapeHtml(product?.name ?? '')}"></label>
        <div class="admin-form__row">
          <label class="admin-field"><span>Variedad</span><input name="variety" required value="${escapeHtml(product?.variety ?? '')}"></label>
          <label class="admin-field"><span>Región</span><input name="region" required value="${escapeHtml(product?.region ?? '')}"></label>
        </div>
        <div class="admin-form__row">
          <label class="admin-field"><span>Precio COP</span><input name="price" type="number" min="0" step="1000" required value="${product?.price ?? ''}"></label>
          <label class="admin-field"><span>Peso</span><input name="weight" required value="${escapeHtml(product?.weight ?? '250 g')}"></label>
        </div>
        <label class="admin-field"><span>Tostión / proceso</span><input name="roast" value="${escapeHtml(product?.roast ?? '')}"></label>
        <label class="admin-field"><span>Notas (coma)</span><input name="notes" value="${escapeHtml((product?.notes ?? []).join(', '))}"></label>
        <label class="admin-field">
          <span>Imagen</span>
          <input type="file" name="image" accept="image/*">
          ${product?.imageUrl ? `<img class="admin-form__preview" src="${escapeHtml(product.imageUrl)}" alt="">` : ''}
        </label>
        <label class="admin-check"><input type="checkbox" name="featured" ${product?.featured ? 'checked' : ''}><span>Destacado</span></label>
        <label class="admin-check"><input type="checkbox" name="active" ${product?.active !== false ? 'checked' : ''}><span>Activo en tienda</span></label>
        <div class="admin-form__actions">
          <button type="button" class="admin-btn admin-btn--ghost" data-close-modal>Cancelar</button>
          <button type="submit" class="admin-btn admin-btn--primary">Guardar producto</button>
        </div>
      </form>`;

    modal.hidden = false;
    this.#wireModal();
    body.querySelector('#productForm')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      let imageUrl = product?.imageUrl ?? '';
      const file = fd.get('image');
      if (file instanceof File && file.size > 0) imageUrl = await this.#fileToDataUrl(file);
      const notes = String(fd.get('notes') ?? '').split(',').map((n) => n.trim()).filter(Boolean);
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

  /** @param {File} file */
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
