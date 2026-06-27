/**
 * @file Renderizado dinámico del menú con acordeón de ingredientes
 * @module menu
 */

import { $, escapeHtml, formatCop } from './utils.js';

/** @typedef {{ id: string; name: string; price: number; description?: string; ingredients: string[]; image?: string | null; featured?: boolean }} MenuItem */
/** @typedef {{ id: string; name: string; items: MenuItem[] }} MenuSection */

/**
 * Carga y renderiza la carta desde content/menu.json
 */
export class GhostMenu {
  /** @type {HTMLElement | null} */
  #root = null;

  /**
   * @param {string} selector
   */
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
      this.#root.removeAttribute('hidden');
      this.#root.setAttribute('aria-busy', 'false');
    } catch (err) {
      console.error('GhostMenu:', err);
      this.#root.innerHTML = this.#renderError();
    }
  }

  /**
   * @param {object} data
   */
  #render(data) {
    const { venue, sections, meta } = data;
    const ticket = meta?.ticketTarget ?? 32000;

    return `
      ${this.#renderVenue(venue)}
      <p class="ghost-menu-intro reveal">
        Carta educativa con ingredientes y notas de cata. Precios alineados al modelo de ingeniería de menú Ghost.
        Ticket objetivo ponderado: <strong>${escapeHtml(formatCop(ticket))}</strong>.
      </p>
      ${sections.map((s) => this.#renderSection(s)).join('')}
    `;
  }

  /**
   * @param {object} venue
   */
  #renderVenue(venue) {
    if (!venue?.image) return '';

    return `
      <figure class="ghost-menu-venue reveal">
        <img
          class="ghost-menu-venue__img"
          src="${venue.image}"
          alt="${escapeHtml(venue.title ?? 'Local Ghost Specialty Coffee')}"
          width="1200"
          height="675"
          loading="eager"
          decoding="async"
        >
        <figcaption class="ghost-menu-venue__caption">
          <h2 class="ghost-menu-venue__title">${escapeHtml(venue.title ?? '')}</h2>
          <p class="ghost-menu-venue__desc">${escapeHtml(venue.description ?? '')}</p>
        </figcaption>
      </figure>
    `;
  }

  /**
   * @param {MenuSection} section
   */
  #renderSection(section) {
    const featured = section.items.filter((i) => i.featured && i.image);
    const rest = section.items.filter((i) => !i.featured || !i.image);

    return `
      <section class="ghost-menu-group reveal" aria-labelledby="menu-${section.id}">
        <h2 class="ghost-menu-group__title" id="menu-${section.id}">${escapeHtml(section.name)}</h2>
        ${featured.length ? `<div class="ghost-menu-grid">${featured.map((i) => this.#renderCard(i)).join('')}</div>` : ''}
        <div class="ghost-menu-list">${rest.map((i) => this.#renderAccordion(i)).join('')}</div>
      </section>
    `;
  }

  /**
   * @param {MenuItem} item
   */
  #renderCard(item) {
    return `
      <article class="ghost-menu-card">
        ${item.image ? `<img class="ghost-menu-card__img" src="${escapeHtml(item.image)}" alt="${escapeHtml(item.name)}" width="400" height="300" loading="lazy" decoding="async">` : ''}
        <div class="ghost-menu-card__body">
          <div class="ghost-menu-card__head">
            <h3 class="ghost-menu-card__name">${escapeHtml(item.name)}</h3>
            <span class="ghost-menu-card__price">${escapeHtml(formatCop(item.price))}</span>
          </div>
          ${item.description ? `<p class="ghost-menu-card__desc">${escapeHtml(item.description)}</p>` : ''}
          ${this.#renderIngredientsPanel(item)}
        </div>
      </article>
    `;
  }

  /**
   * @param {MenuItem} item
   */
  #renderAccordion(item) {
    return `
      <details class="ghost-menu-accordion">
        <summary class="ghost-menu-accordion__summary">
          <span class="ghost-menu-accordion__info">
            <span class="ghost-menu-accordion__name">${escapeHtml(item.name)}</span>
            ${item.description ? `<span class="ghost-menu-accordion__desc">${escapeHtml(item.description)}</span>` : ''}
          </span>
          <span class="ghost-menu-accordion__price">${escapeHtml(formatCop(item.price))}</span>
        </summary>
        <div class="ghost-menu-accordion__panel">
          ${this.#renderIngredientsList(item.ingredients)}
        </div>
      </details>
    `;
  }

  /**
   * @param {MenuItem} item
   */
  #renderIngredientsPanel(item) {
    return `
      <details class="ghost-menu-card__details">
        <summary class="ghost-menu-card__toggle">Ver ingredientes</summary>
        <div class="ghost-menu-card__ingredients">
          ${this.#renderIngredientsList(item.ingredients)}
        </div>
      </details>
    `;
  }

  /**
   * @param {string[]} ingredients
   */
  #renderIngredientsList(ingredients) {
    if (!ingredients?.length) {
      return '<p class="ghost-menu-ingredients__empty">Consulta en barra los componentes del día.</p>';
    }

    return `
      <p class="ghost-menu-ingredients__label">Ingredientes</p>
      <ul class="ghost-menu-ingredients">
        ${ingredients.map((ing) => `<li>${escapeHtml(ing)}</li>`).join('')}
      </ul>
    `;
  }

  #renderError() {
    return `
      <p class="ghost-menu-error" role="alert">
        No pudimos cargar la carta completa. Recarga la página o escríbenos por WhatsApp.
      </p>
    `;
  }
}
