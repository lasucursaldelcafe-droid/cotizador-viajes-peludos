/**
 * @file Carta Ghost — acordeón de ingredientes (sin imágenes)
 * @module menu
 */

import { $, escapeHtml, formatCop } from './utils.js';

/**
 * Carga y renderiza la carta desde content/menu.json
 */
export class GhostMenu {
  /** @type {HTMLElement | null} */
  #root = null;

  constructor(selector = '#ghostMenuRoot') {
    this.#root = $(selector);
  }

  async init() {
    if (!this.#root) return;

    try {
      const res = await fetch('content/menu.json');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      this.#root.innerHTML = this.#render(data);
      this.#root.setAttribute('aria-busy', 'false');
    } catch (err) {
      console.error('GhostMenu:', err);
      this.#root.innerHTML = '<p class="ghost-menu-error" role="alert">No pudimos cargar la carta. Recarga o escríbenos por WhatsApp.</p>';
    }
  }

  #render(data) {
    const ticket = data.meta?.ticketTarget ?? 32000;

    return `
      <p class="ghost-carta-intro reveal">
        Toca cada plato para ver <strong>ingredientes</strong> y precio.
        Ticket objetivo: <strong>${escapeHtml(formatCop(ticket))}</strong>.
      </p>
      <nav class="ghost-carta-nav reveal" aria-label="Secciones de la carta">
        ${data.sections.map((s) => `<a class="ghost-carta-nav__link" href="#carta-${escapeHtml(s.id)}">${escapeHtml(s.name)}</a>`).join('')}
      </nav>
      ${data.sections.map((s) => this.#renderSection(s)).join('')}
    `;
  }

  #renderSection(section) {
    return `
      <section class="ghost-carta-section reveal" id="carta-${escapeHtml(section.id)}" aria-labelledby="carta-title-${escapeHtml(section.id)}">
        <header class="ghost-carta-section__head">
          <h2 class="ghost-carta-section__title" id="carta-title-${escapeHtml(section.id)}">${escapeHtml(section.name)}</h2>
        </header>
        <div class="ghost-carta-list">
          ${section.items.map((item) => this.#renderItem(item)).join('')}
        </div>
      </section>
    `;
  }

  #renderItem(item) {
    const ingredients = item.ingredients ?? [];

    return `
      <details class="ghost-carta-item">
        <summary class="ghost-carta-item__summary">
          <span class="ghost-carta-item__main">
            <span class="ghost-carta-item__name">${escapeHtml(item.name)}</span>
            ${item.description ? `<span class="ghost-carta-item__desc">${escapeHtml(item.description)}</span>` : ''}
          </span>
          <span class="ghost-carta-item__price">${escapeHtml(formatCop(item.price))}</span>
        </summary>
        <div class="ghost-carta-item__body">
          ${ingredients.length
            ? `<p class="ghost-carta-item__label">Ingredientes</p>
               <ul class="ghost-carta-item__ingredients">${ingredients.map((ing) => `<li>${escapeHtml(ing)}</li>`).join('')}</ul>`
            : '<p class="ghost-carta-item__empty">Pregunta en barra por los componentes del día.</p>'}
        </div>
      </details>
    `;
  }
}
