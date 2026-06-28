/**
 * @file Punto de entrada — Ghost Specialty Coffee
 * @module main
 */

import { BRAND, whatsappUrl } from './config.js';
import { GhostMenu } from './menu.js';
import { GhostNavigation } from './nav.js';
import { GhostProducts } from './products.js';
import { ScrollReveal } from './reveal.js';
import { $, $$ } from './utils.js';

class GhostApp {
  init() {
    new GhostNavigation().init();
    new ScrollReveal().init();

    const page = document.body.dataset.page;
    void this.#initPage(page);

    this.#wireWhatsApp();
    this.#markCurrentPage();
    this.#logBrand();
  }

  /** @param {string | undefined} page */
  async #initPage(page) {
    if (page === 'menu') void new GhostMenu().init();
    if (page === 'origen') void new GhostProducts().init();
    if (page === 'tienda') {
      const { GhostShop } = await import('./shop.js');
      void new GhostShop().init();
    }
    if (page === 'home') {
      const { GhostHome } = await import('./home.js');
      await new GhostHome().init();
      void new GhostProducts('#ghostProductsHome').init();
    }
  }

  /** Enlaza todos los CTAs de WhatsApp del DOM */
  #wireWhatsApp() {
    const links = $$('[data-whatsapp]');
    for (const link of links) {
      const msg = link.dataset.whatsapp ?? undefined;
      link.setAttribute('href', whatsappUrl(msg));
      link.setAttribute('target', '_blank');
      link.setAttribute('rel', 'noopener noreferrer');
    }
  }

  /** Marca página activa según data-page del body */
  #markCurrentPage() {
    const page = document.body.dataset.page;
    if (!page) return;

    const active = $(`.ghost-nav__menu a[href*="${page === 'home' ? 'index' : page}"]`);
    active?.setAttribute('aria-current', 'page');
  }

  #logBrand() {
    if (globalThis.location?.hostname === 'localhost') {
      console.info(`%c${BRAND.fullName}`, 'color:#8DB600;font-weight:bold;font-size:14px');
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new GhostApp().init();
});
