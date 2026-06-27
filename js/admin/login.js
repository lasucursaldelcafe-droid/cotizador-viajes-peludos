/**
 * @file Login admin Ghost
 * @module admin/login
 */

import { isAuthenticated, loginLocal } from './auth.js';

document.addEventListener('DOMContentLoaded', () => {
  if (isAuthenticated()) {
    globalThis.location.href = 'admin.html';
    return;
  }

  const form = document.querySelector('#loginForm');
  const error = document.querySelector('#loginError');

  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const email = String(fd.get('email') ?? '');
    const pin = String(fd.get('pin') ?? '');

    if (loginLocal(email, pin)) {
      globalThis.location.href = 'admin.html';
    } else if (error) {
      error.hidden = false;
      error.textContent = 'Correo o PIN incorrectos. Verifica deploy.config.json → adminEmails.';
    }
  });
});
