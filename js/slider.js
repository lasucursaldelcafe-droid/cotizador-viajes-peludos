/**
 * @file Slider de marca — mensajes y esencia Ghost
 * @module slider
 */

import { $, $$ } from './utils.js';

const AUTOPLAY_MS = 5500;

export class BrandSlider {
  /** @param {string} rootSelector */
  init(rootSelector) {
    const root = $(rootSelector);
    if (!root) return;

    const track = $('.ghost-slider__track', root);
    const slides = $$('.ghost-slider__slide', root);
    if (!track || slides.length === 0) return;

    const viewport = $('.ghost-slider__viewport', root);
    const dots = $$('.ghost-slider__dot', root);
    const prev = $('.ghost-slider__prev', root);
    const next = $('.ghost-slider__next', root);
    const prefersReduced = globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    const finePointer = globalThis.matchMedia?.('(pointer: fine)').matches ?? true;

    root.setAttribute('tabindex', '0');

    let index = 0;
    /** @type {ReturnType<typeof setInterval> | null} */
    let timer = null;

    const restartProgress = () => {
      if (!viewport) return;
      viewport.classList.remove('is-animating');
      void viewport.offsetWidth;
      viewport.classList.add('is-animating');
    };

    const go = (i) => {
      index = (i + slides.length) % slides.length;
      track.style.transform = `translate3d(-${index * 100}%, 0, 0)`;
      for (const [j, dot] of dots.entries()) {
        dot.classList.toggle('is-active', j === index);
        dot.setAttribute('aria-selected', j === index ? 'true' : 'false');
      }
      for (const [j, slide] of slides.entries()) {
        const active = j === index;
        slide.toggleAttribute('hidden', !active);
        slide.setAttribute('aria-hidden', active ? 'false' : 'true');
        slide.classList.toggle('is-active', active);
      }
      restartProgress();
    };

    const stopTimer = () => {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
    };

    const startTimer = () => {
      if (prefersReduced || slides.length < 2) return;
      stopTimer();
      timer = setInterval(() => go(index + 1), AUTOPLAY_MS);
    };

    const resetTimer = () => {
      stopTimer();
      startTimer();
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

    if (finePointer) {
      root.addEventListener('mouseenter', stopTimer);
      root.addEventListener('mouseleave', startTimer);
    }

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) stopTimer();
      else startTimer();
    });

    root.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        go(index - 1);
        resetTimer();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        go(index + 1);
        resetTimer();
      }
    });

    go(0);
    startTimer();
  }
}

/** @deprecated Usar BrandSlider */
export const ProductSlider = BrandSlider;
