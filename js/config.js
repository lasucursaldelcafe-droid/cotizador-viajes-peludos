/**
 * @file Configuración central de Ghost Specialty Coffee
 * @module config
 */

/** @typedef {Object} BrandConfig
 * @property {string} name
 * @property {string} fullName
 * @property {string} whatsapp
 * @property {string} email
 * @property {string} instagram
 */

/** @type {Readonly<Record<string, string>>} */
export const IMAGES = Object.freeze({
  logoMark: 'assets/images/brand/logo-mark.png',
  logoHorizontal: 'assets/images/brand/logo-horizontal.png',
  logoRoundSign: 'assets/images/brand/logo-round-sign.png',
  heroIsland: 'assets/images/brand/hero-island.png',
  productBagPapayo: 'assets/images/brand/product-bag-papayo.png',
  productCupHot: 'assets/images/brand/product-cup-hot.png',
  bolsaPapayo: 'assets/images/products/bolsa-papayo.png',
  vasoHot: 'assets/images/products/vaso-hot.png',
});

/** @type {BrandConfig} */
export const BRAND = Object.freeze({
  name: 'Ghost',
  fullName: 'Ghost Specialty Coffee',
  whatsapp: '573025159900',
  email: 'hola@ghostspecialtycoffee.co',
  instagram: 'https://www.instagram.com/ghost_specialty_coffee/',
  basePath: detectBasePath(),
});

/** @type {readonly string[]} */
export const NAV_LINKS = Object.freeze([
  { href: 'index.html', label: 'Inicio', id: 'home' },
  { href: 'menu.html', label: 'Menú', id: 'menu' },
  { href: 'origen.html', label: 'Origen', id: 'origen' },
  { href: 'nosotros.html', label: 'Nosotros', id: 'nosotros' },
  { href: 'contacto.html', label: 'Contacto', id: 'contacto' },
]);

/**
 * Detecta subpath de GitHub Pages
 * @returns {string}
 */
function detectBasePath() {
  const { pathname } = globalThis.location ?? { pathname: '' };
  if (pathname.includes('/ghost_coffee_shop')) return '/ghost_coffee_shop';
  if (pathname.includes('/cotizador-viajes-peludos')) return '/cotizador-viajes-peludos';
  return '';
}

/**
 * @param {string} path
 * @returns {string}
 */
export function asset(path) {
  const clean = path.replace(/^\//, '');
  return BRAND.basePath ? `${BRAND.basePath}/${clean}` : clean;
}

/**
 * @param {string} [text]
 * @returns {string}
 */
export function whatsappUrl(text = 'Hola Ghost, quiero información sobre su café de especialidad.') {
  const phone = BRAND.whatsapp.replace(/\D/g, '');
  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
}
