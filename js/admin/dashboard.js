/**
 * @file Dashboard admin — subpáginas por sección (hash routing)
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
import { escapeHtml } from '../utils.js';

const PANELS = [
  { id: 'overview', label: 'Resumen', icon: '◉', subtitle: 'Vista general del sitio y la tienda' },
  { id: 'shops', label: 'Coffee shops', icon: '⌂', subtitle: 'Ubicaciones y datos de contacto' },
  { id: 'products', label: 'Café / Tienda', icon: '☕', subtitle: 'Productos de venta en la tienda pública' },
  { id: 'menu', label: 'Menú coffee shop', icon: '≡', subtitle: 'Carta por secciones' },
  { id: 'brand', label: 'Marca y contacto', icon: '◇', subtitle: 'Textos principales y redes' },
];

/**
 * @typedef {{ panel: string; sub: string | null }} AdminRoute
 */

/** @returns {AdminRoute} */
function parseRoute() {
  const raw = (globalThis.location?.hash ?? '#/overview').replace(/^#\/?/, '');
  const parts = raw.split('/').filter(Boolean);
  return {
    panel: parts[0] || 'overview',
    sub: parts[1] ?? null,
  };
}

/** @param {string} path */
function navigate(path) {
  globalThis.location.hash = `#/${path.replace(/^\//, '')}`;
}

class AdminDashboard {
  /** @type {AdminRoute} */
  #route = parseRoute();

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
    globalThis.addEventListener('hashchange', () => {
      this.#route = parseRoute();
      this.#buildNav();
      this.#render();
    });
    await this.#refresh();
    if (!globalThis.location.hash) navigate('overview');
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
    const activePanel = this.#route.panel;
    nav.innerHTML = PANELS.map((p) =>
      `<button type="button" class="admin-nav-btn${p.id === activePanel ? ' admin-nav-btn--active' : ''}" data-panel="${p.id}">${p.icon} ${p.label}</button>`
    ).join('');
    nav.querySelectorAll('[data-panel]').forEach((btn) => {
      btn.addEventListener('click', () => {
        navigate(btn.dataset.panel ?? 'overview');
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

  /** @returns {typeof PANELS[number]} */
  #panelMeta() {
    return PANELS.find((p) => p.id === this.#route.panel) ?? PANELS[0];
  }

  #render() {
    const meta = this.#panelMeta();
    const title = document.querySelector('#panelTitle');
    const subtitle = document.querySelector('#panelSubtitle');
    const breadcrumb = document.querySelector('#panelBreadcrumb');
    const actions = document.querySelector('#panelActions');
    const root = document.querySelector('#panelRoot');
    if (!root) return;

    const { panel, sub } = this.#route;
    const isSubPage = Boolean(sub);

    if (title) title.textContent = this.#pageTitle(meta, sub);
    if (subtitle) subtitle.textContent = isSubPage ? this.#subPageSubtitle(panel, sub) : meta.subtitle;
    if (breadcrumb) breadcrumb.innerHTML = this.#renderBreadcrumb(meta, sub);

    if (actions) actions.innerHTML = this.#renderActions(panel, sub);

    switch (panel) {
      case 'overview':
        root.innerHTML = this.#renderOverview();
        break;
      case 'shops':
        root.innerHTML = sub ? this.#renderShopDetail(sub) : this.#renderShopsList();
        this.#wireShopDetail(sub);
        break;
      case 'products':
        root.innerHTML = sub ? this.#renderProductDetail(sub) : this.#renderProductsList();
        this.#wireProductDetail(sub);
        break;
      case 'menu':
        root.innerHTML = sub !== null ? this.#renderMenuSectionDetail(sub) : this.#renderMenuList();
        this.#wireMenuDetail(sub);
        break;
      case 'brand':
        root.innerHTML = this.#renderBrand();
        document.querySelector('#adminSaveBrand')?.addEventListener('click', () => this.#saveBrandFromForm());
        break;
      default:
        navigate('overview');
    }

    this.#wireListLinks();
    this.#wireTopActions(panel, sub);
  }

  /** @param {typeof PANELS[number]} meta @param {string | null} sub */
  #pageTitle(meta, sub) {
    if (!sub) return meta.label;
    if (sub === 'new') {
      if (meta.id === 'products') return 'Nuevo producto';
      if (meta.id === 'shops') return 'Nueva coffee shop';
    }
    if (meta.id === 'products') {
      const p = this.#products.find((x) => x.id === sub);
      return p?.name ?? 'Producto';
    }
    if (meta.id === 'shops') {
      const s = this.#shops.find((x) => x.id === sub);
      return s?.name ?? 'Coffee shop';
    }
    if (meta.id === 'menu') {
      const section = this.#menu?.sections?.[Number(sub)];
      return section?.name ?? 'Sección del menú';
    }
    return meta.label;
  }

  /** @param {string} panel @param {string} sub */
  #subPageSubtitle(panel, sub) {
    if (sub === 'new') return 'Completa los datos y guarda para publicar en la tienda.';
    if (panel === 'products') return 'Edita precio, imagen, notas y visibilidad de este producto.';
    if (panel === 'shops') return 'Datos de ubicación, contacto y redes de esta tienda.';
    if (panel === 'menu') return 'Platos y precios de esta sección de la carta.';
    return '';
  }

  /** @param {typeof PANELS[number]} meta @param {string | null} sub */
  #renderBreadcrumb(meta, sub) {
    if (!sub) return '';
    const parent = escapeHtml(meta.label);
    const current = escapeHtml(this.#pageTitle(meta, sub));
    return `
      <a class="admin-breadcrumb__link" href="#/${escapeHtml(meta.id)}">${parent}</a>
      <span class="admin-breadcrumb__sep" aria-hidden="true">/</span>
      <span class="admin-breadcrumb__current">${current}</span>`;
  }

  /** @param {string} panel @param {string | null} sub */
  #renderActions(panel, sub) {
    if (panel === 'shops' && !sub) {
      return '<a class="admin-btn admin-btn--primary" href="#/shops/new">+ Nueva coffee shop</a>';
    }
    if (panel === 'products' && !sub) {
      return '<a class="admin-btn admin-btn--primary" href="#/products/new">+ Nuevo producto</a>';
    }
    if (panel === 'menu' && sub === null) {
      return '<a class="admin-btn admin-btn--ghost" href="menu.html" target="_blank" rel="noopener">Ver menú público</a>';
    }
    if (panel === 'brand') {
      return '<button type="button" class="admin-btn admin-btn--primary" id="adminSaveBrand">Guardar cambios</button>';
    }
    if (panel === 'overview') {
      return '<a class="admin-btn admin-btn--ghost" href="tienda.html" target="_blank" rel="noopener">Ver tienda</a>';
    }
    if (sub) {
      return `<a class="admin-btn admin-btn--ghost" href="#/${panel}">← Volver al listado</a>`;
    }
    return '';
  }

  #wireTopActions(panel, sub) {
    if (panel === 'shops' && !sub) return;
    if (panel === 'products' && !sub) return;
  }

  #wireListLinks() {
    document.querySelectorAll('[data-admin-nav]').forEach((el) => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        const path = el.getAttribute('data-admin-nav');
        if (path) navigate(path);
      });
    });
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
          <a class="admin-card__link" href="#/shops">Gestionar →</a>
        </article>
        <article class="admin-card">
          <p class="admin-card__label">Productos en tienda</p>
          <p class="admin-card__value">${activeProducts}</p>
          <a class="admin-card__link" href="#/products">Gestionar →</a>
        </article>
        <article class="admin-card">
          <p class="admin-card__label">Secciones del menú</p>
          <p class="admin-card__value">${menuSections}</p>
          <a class="admin-card__link" href="#/menu">Gestionar →</a>
        </article>
      </div>
      <div class="admin-card admin-card--wide">
        <h2 class="admin-card__title">Accesos rápidos</h2>
        <ul class="admin-quick-links">
          <li><a href="tienda.html" target="_blank" rel="noopener">Tienda pública</a></li>
          <li><a href="menu.html" target="_blank" rel="noopener">Menú coffee shop</a></li>
          <li><a href="index.html" target="_blank" rel="noopener">Página de inicio</a></li>
        </ul>
        <p class="admin-card__hint">Cada sección del menú lateral abre un listado compacto. Entra a un ítem para editarlo en su subpágina.</p>
      </div>`;
  }

  #renderShopsList() {
    if (!this.#shops.length) {
      return `<p class="admin-empty">No hay coffee shops. <a href="#/shops/new">Crea la primera</a>.</p>`;
    }

    return `
      <ul class="admin-index-list">
        ${this.#shops.map((s) => `
          <li class="admin-index-list__item">
            <a class="admin-index-list__link" href="#/shops/${escapeHtml(s.id)}" data-admin-nav="shops/${escapeHtml(s.id)}">
              <span class="admin-index-list__name">${escapeHtml(s.name)}</span>
              <span class="admin-index-list__meta">
                <span class="admin-status ${s.active ? 'admin-status--on' : 'admin-status--off'}">${s.active ? 'Activa' : 'Inactiva'}</span>
                <span class="admin-index-list__chevron" aria-hidden="true">→</span>
              </span>
            </a>
          </li>`).join('')}
      </ul>`;
  }

  #renderProductsList() {
    if (!this.#products.length) {
      return `<p class="admin-empty">No hay productos. <a href="#/products/new">Añade el primero</a>.</p>`;
    }

    return `
      <ul class="admin-index-list">
        ${this.#products.map((p) => `
          <li class="admin-index-list__item">
            <a class="admin-index-list__link" href="#/products/${escapeHtml(p.id)}" data-admin-nav="products/${escapeHtml(p.id)}">
              <span class="admin-index-list__name">${escapeHtml(p.name)}${p.variety ? ` · ${escapeHtml(p.variety)}` : ''}</span>
              <span class="admin-index-list__meta">
                <span class="admin-status ${p.active ? 'admin-status--on' : 'admin-status--off'}">${p.active ? 'Activo' : 'Oculto'}</span>
                <span class="admin-index-list__chevron" aria-hidden="true">→</span>
              </span>
            </a>
          </li>`).join('')}
      </ul>`;
  }

  #renderMenuList() {
    const sections = this.#menu?.sections ?? [];
    if (!sections.length) return '<p class="admin-empty">No hay secciones en el menú.</p>';

    return `
      <p class="admin-panel-intro">Elige una sección para editar platos y precios. Solo verás el nombre aquí; el detalle está en cada subpágina.</p>
      <ul class="admin-index-list">
        ${sections.map((section, index) => `
          <li class="admin-index-list__item">
            <a class="admin-index-list__link" href="#/menu/${index}" data-admin-nav="menu/${index}">
              <span class="admin-index-list__name">${escapeHtml(section.name)}</span>
              <span class="admin-index-list__meta">
                <span class="admin-index-list__count">${section.items.length} platos</span>
                <span class="admin-index-list__chevron" aria-hidden="true">→</span>
              </span>
            </a>
          </li>`).join('')}
      </ul>`;
  }

  /** @param {string} sub */
  #renderShopDetail(sub) {
    const isNew = sub === 'new';
    const shop = isNew ? null : this.#shops.find((s) => s.id === sub);

    if (!isNew && !shop) {
      return `<p class="admin-empty">Coffee shop no encontrada. <a href="#/shops">Volver al listado</a>.</p>`;
    }

    return `
      <form class="admin-form admin-form--page" id="shopForm">
        <label class="admin-field"><span>Nombre</span><input name="name" required value="${escapeHtml(shop?.name ?? '')}"></label>
        <label class="admin-field"><span>Dirección</span><input name="address" required value="${escapeHtml(shop?.address ?? '')}"></label>
        <label class="admin-field"><span>Ciudad</span><input name="city" required value="${escapeHtml(shop?.city ?? 'Cali')}"></label>
        <label class="admin-field"><span>Teléfono</span><input name="phone" required value="${escapeHtml(shop?.phone ?? '')}"></label>
        <label class="admin-field"><span>Instagram (sin @)</span><input name="instagram" value="${escapeHtml(shop?.instagram ?? '')}"></label>
        <label class="admin-check"><input type="checkbox" name="active" ${shop?.active !== false ? 'checked' : ''}><span>Activa en el sitio</span></label>
        <div class="admin-form__actions admin-form__actions--page">
          ${!isNew ? `<button type="button" class="admin-btn admin-btn--danger" id="adminDeleteShop">Eliminar</button>` : ''}
          <a class="admin-btn admin-btn--ghost" href="#/shops">Cancelar</a>
          <button type="submit" class="admin-btn admin-btn--primary">Guardar coffee shop</button>
        </div>
      </form>`;
  }

  /** @param {string | null} sub */
  #wireShopDetail(sub) {
    if (!sub) return;

    const isNew = sub === 'new';
    const shop = isNew ? null : this.#shops.find((s) => s.id === sub);

    document.querySelector('#shopForm')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const name = String(fd.get('name'));
      const saved = await saveShop({
        id: shop?.id,
        name,
        slug: shop?.slug ?? name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
        address: String(fd.get('address')),
        city: String(fd.get('city')),
        phone: String(fd.get('phone')),
        instagram: String(fd.get('instagram') ?? ''),
        active: fd.get('active') === 'on',
      });
      await this.#refresh();
      navigate(`shops/${saved.id}`);
    });

    document.querySelector('#adminDeleteShop')?.addEventListener('click', async () => {
      if (!shop || !confirm('¿Eliminar esta coffee shop y sus productos?')) return;
      await deleteShop(shop.id);
      await this.#refresh();
      navigate('shops');
    });
  }

  /** @param {string} sub */
  #renderProductDetail(sub) {
    const isNew = sub === 'new';
    const product = isNew ? null : this.#products.find((p) => p.id === sub);

    if (!isNew && !product) {
      return `<p class="admin-empty">Producto no encontrado. <a href="#/products">Volver al listado</a>.</p>`;
    }

    if (isNew && !this.#shops.length) {
      return `<p class="admin-empty">Primero crea una <a href="#/shops/new">coffee shop</a>.</p>`;
    }

    const shopOptions = this.#shops.map((s) =>
      `<option value="${escapeHtml(s.id)}" ${product?.shopId === s.id ? 'selected' : ''}>${escapeHtml(s.name)}</option>`
    ).join('');

    const priceLabel = product?.price && product.price > 0 ? product.price : '';

    return `
      <form class="admin-form admin-form--page" id="productForm">
        <label class="admin-field"><span>Nombre del producto</span><input name="name" required value="${escapeHtml(product?.name ?? '')}" placeholder="Ghost · Regional Valle"></label>
        <label class="admin-field"><span>Coffee shop</span><select name="shopId" required>${shopOptions}</select></label>
        <div class="admin-form__row">
          <label class="admin-field"><span>Variedad</span><input name="variety" required value="${escapeHtml(product?.variety ?? '')}" placeholder="Castillo"></label>
          <label class="admin-field"><span>Región</span><input name="region" required value="${escapeHtml(product?.region ?? '')}" placeholder="Valle del Cauca"></label>
        </div>
        <div class="admin-form__row">
          <label class="admin-field"><span>Precio COP (0 = consultar)</span><input name="price" type="number" min="0" step="1000" value="${priceLabel}"></label>
          <label class="admin-field"><span>Peso</span><input name="weight" required value="${escapeHtml(product?.weight ?? '250 g')}"></label>
        </div>
        <label class="admin-field"><span>Tostión / proceso</span><input name="roast" value="${escapeHtml(product?.roast ?? '')}"></label>
        <label class="admin-field"><span>Notas de cata (separadas por coma)</span><input name="notes" value="${escapeHtml((product?.notes ?? []).join(', '))}"></label>
        <label class="admin-field">
          <span>Imagen del producto</span>
          <input type="file" name="image" accept="image/*">
          ${product?.imageUrl ? `<img class="admin-form__preview" src="${escapeHtml(product.imageUrl)}" alt="">` : ''}
        </label>
        <div class="admin-form__checks">
          <label class="admin-check"><input type="checkbox" name="featured" ${product?.featured ? 'checked' : ''}><span>Destacado en tienda</span></label>
          <label class="admin-check"><input type="checkbox" name="active" ${product?.active !== false ? 'checked' : ''}><span>Visible en tienda pública</span></label>
        </div>
        <div class="admin-form__actions admin-form__actions--page">
          ${!isNew ? `<button type="button" class="admin-btn admin-btn--danger" id="adminDeleteProduct">Eliminar producto</button>` : ''}
          <a class="admin-btn admin-btn--ghost" href="#/products">Cancelar</a>
          <button type="submit" class="admin-btn admin-btn--primary">Guardar producto</button>
        </div>
      </form>`;
  }

  /** @param {string | null} sub */
  #wireProductDetail(sub) {
    if (!sub) return;

    const isNew = sub === 'new';
    const product = isNew ? null : this.#products.find((p) => p.id === sub);

    document.querySelector('#productForm')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      let imageUrl = product?.imageUrl ?? '';
      const file = fd.get('image');
      if (file instanceof File && file.size > 0) imageUrl = await this.#fileToDataUrl(file);
      const notes = String(fd.get('notes') ?? '').split(',').map((n) => n.trim()).filter(Boolean);
      const saved = await saveProduct({
        id: product?.id,
        shopId: String(fd.get('shopId')),
        name: String(fd.get('name')),
        variety: String(fd.get('variety')),
        region: String(fd.get('region')),
        price: Number(fd.get('price')) || 0,
        weight: String(fd.get('weight')),
        roast: String(fd.get('roast') ?? ''),
        notes,
        imageUrl,
        featured: fd.get('featured') === 'on',
        active: fd.get('active') === 'on',
      });
      await this.#refresh();
      navigate(`products/${saved.id}`);
    });

    document.querySelector('#adminDeleteProduct')?.addEventListener('click', async () => {
      if (!product || !confirm('¿Eliminar este producto?')) return;
      await deleteProduct(product.id);
      await this.#refresh();
      navigate('products');
    });
  }

  /** @param {string} sub */
  #renderMenuSectionDetail(sub) {
    const index = Number(sub);
    const section = this.#menu?.sections?.[index];

    if (!section) {
      return `<p class="admin-empty">Sección no encontrada. <a href="#/menu">Volver al listado</a>.</p>`;
    }

    return `
      <p class="admin-panel-intro">Edita los platos de <strong>${escapeHtml(section.name)}</strong>. Los cambios se publican en <a href="menu.html" target="_blank" rel="noopener">menu.html</a>.</p>
      <form class="admin-form admin-form--page" id="menuSectionForm">
        ${section.items.map((item, ii) => `
          <div class="admin-menu-item">
            <label class="admin-field admin-field--grow">
              <span>Plato</span>
              <input name="item_${ii}_name" value="${escapeHtml(item.name)}" required>
            </label>
            <label class="admin-field admin-field--price">
              <span>Precio COP</span>
              <input name="item_${ii}_price" type="number" min="0" step="500" value="${Number(item.price)}" required>
            </label>
          </div>`).join('')}
        <div class="admin-form__actions admin-form__actions--page">
          <a class="admin-btn admin-btn--ghost" href="#/menu">← Volver a secciones</a>
          <button type="submit" class="admin-btn admin-btn--primary">Guardar sección</button>
        </div>
      </form>`;
  }

  /** @param {string | null} sub */
  #wireMenuDetail(sub) {
    if (sub === null) return;

    const index = Number(sub);
    document.querySelector('#menuSectionForm')?.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!this.#menu?.sections?.[index]) return;
      const fd = new FormData(e.target);
      const menu = structuredClone(this.#menu);
      const section = menu.sections[index];
      section.items.forEach((item, ii) => {
        item.name = String(fd.get(`item_${ii}_name`) ?? item.name);
        item.price = Number(fd.get(`item_${ii}_price`) ?? item.price);
      });
      saveMenuData(menu);
      this.#menu = menu;
      alert('Sección guardada. Recarga menu.html para ver los cambios.');
    });
  }

  #renderBrand() {
    const b = getBrandSettings();
    return `
      <form id="brandAdminForm" class="admin-form admin-form--page admin-form--card">
        <label class="admin-field"><span>Tagline</span><input name="tagline" value="${escapeHtml(b.tagline)}"></label>
        <label class="admin-field"><span>Titular principal</span><input name="headline" value="${escapeHtml(b.headline)}"></label>
        <label class="admin-field"><span>Teléfono</span><input name="phone" value="${escapeHtml(b.phone)}"></label>
        <label class="admin-field"><span>Correo</span><input name="email" type="email" value="${escapeHtml(b.email)}"></label>
        <label class="admin-field"><span>Instagram (sin @)</span><input name="instagram" value="${escapeHtml(b.instagram)}"></label>
        <label class="admin-field"><span>Dirección</span><input name="address" value="${escapeHtml(b.address)}"></label>
        <label class="admin-field"><span>Horarios</span><input name="hours" value="${escapeHtml(b.hours)}"></label>
      </form>`;
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

  /** @param {File} file */
  #fileToDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new AdminDashboard().init();
});
