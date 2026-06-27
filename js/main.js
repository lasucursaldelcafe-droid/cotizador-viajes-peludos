/**
 * @file Punto de entrada — Ghost Specialty Coffee
 * @module main
 */

import { BRAND, whatsappUrl } from './config.js';
import { GhostMenu } from './menu.js';
import { GhostNavigation } from './nav.js';
import { ScrollReveal } from './reveal.js';
import { $, $$ } from './utils.js';

class GhostApp {
  init() {
    new GhostNavigation().init();
    new ScrollReveal().init();
    if (document.body.dataset.page === 'menu') {
      void new GhostMenu().init();
    }
    this.#wireWhatsApp();
    this.#markCurrentPage();
    this.#logBrand();
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
