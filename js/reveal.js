/**
 * @file Revelado al scroll — fallback para navegadores sin scroll-driven animations
 * @module reveal
 */

import { $$ } from './utils.js';

export class ScrollReveal {
  /** @type {IntersectionObserver|null} */
  #observer = null;

  init() {
    if (CSS.supports('animation-timeline', 'view()')) return;

    const elements = $$('.reveal');
    if (!elements.length) return;

    this.#observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            this.#observer?.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' },
    );

    for (const el of elements) {
      this.#observer.observe(el);
    }
  }
}
