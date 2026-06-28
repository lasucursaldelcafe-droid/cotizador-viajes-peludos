/**
 * @file Utilidades compartidas
 * @module utils
 */

const copFormatter = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
});

/**
 * @param {number} value
 * @returns {string}
 */
export function formatCop(value) {
  return copFormatter.format(value);
}

/**
 * @param {string} str
 * @returns {string}
 */
export function escapeHtml(str) {
  const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  return String(str ?? '').replace(/[&<>"']/g, (ch) => map[ch] ?? ch);
}

/**
 * @param {string} selector
 * @param {ParentNode} [root]
 * @returns {Element|null}
 */
export const $ = (selector, root = document) => root.querySelector(selector);

/**
 * @param {string} selector
 * @param {ParentNode} [root]
 * @returns {Element[]}
 */
export const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

/**
 * @template T
 * @param {T} fn
 * @returns {(...args: Parameters<T>) => void}
 */
export function debounce(fn, ms = 100) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}
