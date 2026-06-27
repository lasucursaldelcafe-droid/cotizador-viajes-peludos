/**
 * @file Controlador de navegación
 * @module nav
 */

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
