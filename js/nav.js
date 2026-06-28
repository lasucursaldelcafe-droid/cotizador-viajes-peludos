/**
 * @file Controlador de navegación
 * @module nav
 */

import { NAV_ADMIN, NAV_LINKS } from './config.js';
import { debounce, $, $$ } from './utils.js';

export class GhostNavigation {
  /** @type {HTMLElement|null} */
  #nav = null;

  /** @type {HTMLButtonElement|null} */
  #toggle = null;

  /** @type {HTMLElement|null} */
  #menu = null;

  /** @type {boolean} */
  #open = false;

  /** @type {(() => void)|null} */
  #onScroll = null;

  init() {
    this.#nav = $('.ghost-nav');
    this.#toggle = $('#ghostNavToggle');
    this.#menu = $('#ghostNavMenu');

    if (!this.#nav) return;

    this.#renderMenu();
    this.#toggle?.addEventListener('click', () => this.#toggleMenu());
    $$('.ghost-nav__menu a', this.#menu ?? document).forEach((link) => {
      link.addEventListener('click', () => this.#closeMenu());
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.#open) this.#closeMenu();
    });

    this.#onScroll = debounce(() => {
      const scrolled = globalThis.scrollY > 48;
      this.#nav?.classList.toggle('is-scrolled', scrolled);
    }, 16);

    globalThis.addEventListener('scroll', this.#onScroll, { passive: true });
    this.#onScroll();
  }

  #renderMenu() {
    if (!this.#menu) return;

    const page = document.body.dataset.page ?? '';
    const links = NAV_LINKS.map((link) => {
      const isCurrent =
        (page === 'home' && link.id === 'home') ||
        (page && page !== 'home' && link.id === page);
      return `<li><a href="${link.href}"${isCurrent ? ' aria-current="page"' : ''}>${link.label}</a></li>`;
    });

    links.push(
      `<li class="ghost-nav__admin-item"><a class="ghost-nav__admin" href="${NAV_ADMIN.href}">${NAV_ADMIN.label}</a></li>`
    );

    this.#menu.innerHTML = links.join('');
  }

  #toggleMenu() {
    this.#open = !this.#open;
    this.#menu?.classList.toggle('is-open', this.#open);
    this.#toggle?.setAttribute('aria-expanded', String(this.#open));
  }

  #closeMenu() {
    this.#open = false;
    this.#menu?.classList.remove('is-open');
    this.#toggle?.setAttribute('aria-expanded', 'false');
  }
}
