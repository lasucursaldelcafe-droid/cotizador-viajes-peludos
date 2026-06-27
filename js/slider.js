/**
 * @file Slider de productos — Ghost Specialty Coffee
 * @module slider
 */

import { $, $$ } from './utils.js';

export class ProductSlider {
  /** @param {string} rootSelector */
  init(rootSelector) {
    const root = $(rootSelector);
    if (!root) return;

    const track = $('.ghost-slider__track', root);
    const slides = $$('.ghost-slider__slide', root);
    if (!track || slides.length === 0) return;

    const dots = $$('.ghost-slider__dot', root);
    const prev = $('.ghost-slider__prev', root);
    const next = $('.ghost-slider__next', root);

    let index = 0;
    /** @type {ReturnType<typeof setInterval> | null} */
    let timer = null;

    const go = (i) => {
      index = (i + slides.length) % slides.length;
      track.style.transform = `translate3d(-${index * 100}%, 0, 0)`;
      for (const [j, dot] of dots.entries()) {
        dot.classList.toggle('is-active', j === index);
        dot.setAttribute('aria-selected', j === index ? 'true' : 'false');
      }
      for (const [j, slide] of slides.entries()) {
        slide.toggleAttribute('hidden', j !== index);
      }
    };

    const resetTimer = () => {
      if (timer) clearInterval(timer);
      timer = setInterval(() => go(index + 1), 5500);
    };

    prev?.addEventListener('click', () => {
      go(index - 1);
      resetTimer();
    });
    next?.addEventListener('click', () => {
      go(index + 1);
      resetTimer();
    });
    for (const [i, dot] of dots.entries()) {
      dot.addEventListener('click', () => {
        go(i);
        resetTimer();
      });
    }

    root.addEventListener('mouseenter', () => {
      if (timer) clearInterval(timer);
    });
    root.addEventListener('mouseleave', resetTimer);

    go(0);
    resetTimer();
  }
}
