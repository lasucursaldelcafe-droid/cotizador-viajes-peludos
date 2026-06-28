/**
 * @file Inicialización de la home — slider
 * @module home
 */

import { ProductSlider } from './slider.js';

export class GhostHome {
  init() {
    new ProductSlider().init('#ghostHeroSlider');
  }
}

