/**
 * @file Autenticación admin Ghost
 * @module admin/auth
 */

const SESSION_KEY = 'ghost_admin_session';

/** @returns {object} */
export function getFirebaseConfig() {
  return globalThis.VP_FIREBASE_CONFIG ?? { enabled: false, adminEmails: [] };
}

/**
 * @returns {boolean}
 */
export function isAuthenticated() {
  return Boolean(sessionStorage.getItem(SESSION_KEY));
}

/**
 * @param {string} email
 * @param {string} pin
 * @returns {boolean}
 */
export function loginLocal(email, pin) {
  const cfg = getFirebaseConfig();
  const allowed = (cfg.adminEmails ?? []).map((e) => e.toLowerCase());
  const devPin = cfg.adminPin ?? 'ghost2026';
  const normalized = email.trim().toLowerCase();
  const userOk = normalized === 'admin' || allowed.length === 0 || allowed.includes(normalized);
  const pinOk = pin === devPin;

  if (userOk && pinOk) {
    const identity = normalized === 'admin' ? (allowed[0] ?? 'admin@ghost.com') : normalized;
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({ email: identity, user: normalized, at: Date.now() }));
    return true;
  }
  return false;
}

export function logout() {
  sessionStorage.removeItem(SESSION_KEY);
}

/**
 * @returns {string|null}
 */
export function currentEmail() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw).email : null;
  } catch {
    return null;
  }
}

/**
 * Redirige a login si no hay sesión
 */
export function requireAuth() {
  if (!isAuthenticated()) {
    globalThis.location.href = 'admin.html';
  }
}
