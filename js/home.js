/**
 * @file Inicialización de la home — slider de marca e interacciones
 * @module home
 */

import { initParallaxVisual, initProcessHotspots } from './home-interactive.js';
import { BrandSlider } from './slider.js';
import { escapeHtml } from './utils.js';

/** @typedef {{ id: string; kicker: string; title: string; titleLine2?: string; essence: string; tint: string }} BrandSlide */

export class GhostHome {
  async init() {
    await this.#buildBrandSlider();
    new BrandSlider().init('#ghostHeroSlider');
    initParallaxVisual('#ghostProcessParallax');
    initParallaxVisual('#ghostStoreParallax');
    initProcessHotspots();
  }

  async #buildBrandSlider() {
    const track = document.querySelector('#ghostBrandTrack');
    const dotsRoot = document.querySelector('#ghostBrandDots');
    if (!track || !dotsRoot) return;

    track.setAttribute('aria-busy', 'true');
    dotsRoot.setAttribute('aria-busy', 'true');

    try {
      const res = await fetch('content/brand-slides.json');
      if (!res.ok) throw new Error('brand-slides.json');
      const data = await res.json();
      const slides = /** @type {BrandSlide[]} */ (data.slides ?? []);

      track.innerHTML = slides.map((slide, i) => `
        <article class="ghost-slider__slide ghost-slider__slide--brand ghost-slider__slide--${escapeHtml(slide.tint)}"${i > 0 ? ' hidden' : ''} data-tint="${escapeHtml(slide.tint)}">
          <div class="ghost-slider__glow" aria-hidden="true"></div>
          <div class="ghost-slider__glow ghost-slider__glow--secondary" aria-hidden="true"></div>
          <div class="ghost-slider__brand">
            <p class="ghost-slider__kicker">${escapeHtml(slide.kicker)}</p>
            <h2 class="ghost-slider__headline">
              <span class="ghost-slider__headline-main">${escapeHtml(slide.title)}</span>
              ${slide.titleLine2 ? `<span class="ghost-slider__headline-sub">${escapeHtml(slide.titleLine2)}</span>` : ''}
            </h2>
            <p class="ghost-slider__essence">${escapeHtml(slide.essence)}</p>
          </div>
        </article>`).join('');

      dotsRoot.innerHTML = slides.map((_, i) => `
        <button type="button" class="ghost-slider__dot${i === 0 ? ' is-active' : ''}" aria-label="Mensaje ${i + 1}" aria-selected="${i === 0 ? 'true' : 'false'}"></button>`).join('');
    } catch (err) {
      console.error('GhostHome brand slider:', err);
      track.innerHTML = `
        <article class="ghost-slider__slide ghost-slider__slide--brand ghost-slider__slide--amber is-active">
          <div class="ghost-slider__glow" aria-hidden="true"></div>
          <div class="ghost-slider__brand">
            <p class="ghost-slider__kicker">Del origen al ritual</p>
            <h2 class="ghost-slider__headline">
              <span class="ghost-slider__headline-main">Especialidad</span>
              <span class="ghost-slider__headline-sub">y elegancia</span>
            </h2>
            <p class="ghost-slider__essence">Café de especialidad en Cali con trazabilidad y presencia de marca.</p>
          </div>
        </article>`;
      dotsRoot.innerHTML = '<button type="button" class="ghost-slider__dot is-active" aria-label="Mensaje 1" aria-selected="true"></button>';
    } finally {
      track.removeAttribute('aria-busy');
      dotsRoot.removeAttribute('aria-busy');
    }
  }
}
