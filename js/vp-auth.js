/**
 * Autenticacion Google via Firebase + roles admin / cotizador
 */
const VpAuth = (function () {
  let app = null;
  let auth = null;
  let db = null;
  let currentUser = null;
  let currentProfile = null;
  let lastAuthError = null;
  const listeners = new Set();

  const AUTH_ERRORS = {
    'auth/unauthorized-domain': 'Dominio no autorizado. Falta configurar Firebase Auth para este sitio.',
    'auth/popup-blocked': 'El navegador bloqueo la ventana. Intentando otra forma...',
    'auth/popup-closed-by-user': 'Cerraste la ventana de Google. Intenta de nuevo.',
    'auth/cancelled-popup-request': 'Espera a que termine el inicio de sesion anterior.',
    'auth/network-request-failed': 'Sin conexion a internet. Revisa tu red.',
    'auth/operation-not-allowed': 'Google Sign-In no esta habilitado en Firebase.',
    'auth/account-exists-with-different-credential': 'Ya existe una cuenta con ese correo usando otro metodo.',
    'auth/operation-not-supported-in-this-environment': 'Esta app no funciona abriendo el archivo directamente (file://). Abre https://lasucursaldelcafe-droid.github.io/cotizador-viajes-peludos/ o ejecuta un servidor local (Live Server, npx serve, etc.).'
  };

  const UNSUPPORTED_ENV_MSG = AUTH_ERRORS['auth/operation-not-supported-in-this-environment'];

  function isAuthEnvironmentSupported() {
    const p = location.protocol;
    if (p !== 'http:' && p !== 'https:' && p !== 'chrome-extension:') return false;
    try {
      localStorage.setItem('__vp_env', '1');
      localStorage.removeItem('__vp_env');
      sessionStorage.setItem('__vp_env', '1');
      sessionStorage.removeItem('__vp_env');
    } catch (e) {
      return false;
    }
    return true;
  }

  function unsupportedEnvError() {
    return { code: 'auth/operation-not-supported-in-this-environment', message: UNSUPPORTED_ENV_MSG };
  }

  function isConfigured() {
    const c = typeof VP_FIREBASE_CONFIG !== 'undefined' ? VP_FIREBASE_CONFIG : null;
    return !!(c && c.enabled && c.apiKey && c.projectId);
  }

  function formatAuthError(err) {
    if (!err) return 'Error de autenticacion';
    return AUTH_ERRORS[err.code] || err.message || 'No se pudo iniciar sesion con Google';
  }

  function notify() {
    listeners.forEach((fn) => {
      try { fn({ user: currentUser, profile: currentProfile, error: lastAuthError }); } catch (e) { console.error(e); }
    });
  }

  function normalizeEmail(email) {
    return (email || '').trim().toLowerCase();
  }

  function isAdminEmail(email) {
    const list = VP_FIREBASE_CONFIG.adminEmails || [];
    return list.map(normalizeEmail).includes(normalizeEmail(email));
  }

  async function ensureUserProfile(user) {
    const ref = db.collection('users').doc(user.uid);
    const snap = await ref.get();
    if (snap.exists) {
      currentProfile = snap.data();
      return currentProfile;
    }
    const role = isAdminEmail(user.email) ? 'admin' : 'cotizador';
    const profile = {
      uid: user.uid,
      email: user.email || '',
      displayName: user.displayName || user.email || 'Usuario',
      photoURL: user.photoURL || '',
      role,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      lastLoginAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    await ref.set(profile);
    currentProfile = { ...profile, role };
    return currentProfile;
  }

  async function touchLogin(user) {
    const ref = db.collection('users').doc(user.uid);
    await ref.set({
      lastLoginAt: firebase.firestore.FieldValue.serverTimestamp(),
      displayName: user.displayName || user.email || 'Usuario',
      photoURL: user.photoURL || '',
      email: user.email || ''
    }, { merge: true });
    const snap = await ref.get();
    currentProfile = snap.data() || currentProfile;
  }

  function cotizadorMeta() {
    if (!currentUser) return null;
    return {
      uid: currentUser.uid,
      email: currentUser.email || '',
      displayName: currentProfile?.displayName || currentUser.displayName || '',
      role: currentProfile?.role || 'cotizador'
    };
  }

  function preferRedirect() {
    const host = location.hostname;
    if (host.includes('github.io') || host.includes('web.app') || host.includes('firebaseapp.com')) {
      return true;
    }
    return /Android|iPhone|iPad|iPod|Mobile|webOS|BlackBerry/i.test(navigator.userAgent)
      || (window.matchMedia && window.matchMedia('(max-width: 768px)').matches);
  }

  async function init() {
    if (!isConfigured()) return { configured: false };
    if (!isAuthEnvironmentSupported()) {
      lastAuthError = unsupportedEnvError();
      return { configured: true, unsupportedEnv: true, user: null, profile: null, error: lastAuthError };
    }
    if (typeof firebase === 'undefined') throw new Error('Firebase SDK no cargado');

    lastAuthError = null;
    app = firebase.apps.length
      ? firebase.app()
      : firebase.initializeApp({
          apiKey: VP_FIREBASE_CONFIG.apiKey,
          authDomain: VP_FIREBASE_CONFIG.authDomain,
          projectId: VP_FIREBASE_CONFIG.projectId,
          storageBucket: VP_FIREBASE_CONFIG.storageBucket,
          messagingSenderId: VP_FIREBASE_CONFIG.messagingSenderId,
          appId: VP_FIREBASE_CONFIG.appId
        });
    auth = firebase.auth();
    db = firebase.firestore();
    try {
      await auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);
    } catch (e) {
      console.warn('setPersistence:', e);
    }

    try {
      const result = await auth.getRedirectResult();
      if (result.user) {
        lastAuthError = null;
      }
    } catch (e) {
      lastAuthError = e;
      console.warn('Redirect auth:', e);
    }

    return new Promise((resolve) => {
      let resolved = false;
      auth.onAuthStateChanged(async (user) => {
        currentUser = user;
        currentProfile = null;
        notify();
        if (user) {
          try {
            await ensureUserProfile(user);
            await touchLogin(user);
            lastAuthError = null;
            notify();
          } catch (e) {
            console.error('Perfil usuario:', e);
          }
        }
        if (!resolved) {
          resolved = true;
          resolve({ configured: true, user: currentUser, profile: currentProfile, error: lastAuthError });
        }
      });
    });
  }

  async function signInGoogle() {
    if (!isAuthEnvironmentSupported()) {
      lastAuthError = unsupportedEnvError();
      throw new Error(formatAuthError(lastAuthError));
    }
    if (!auth) await init();
    if (!auth) throw new Error('Auth no inicializado');

    const provider = new firebase.auth.GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });

    if (preferRedirect()) {
      await auth.signInWithRedirect(provider);
      return null;
    }

    try {
      const cred = await auth.signInWithPopup(provider);
      lastAuthError = null;
      return cred.user;
    } catch (e) {
      if (e.code === 'auth/popup-blocked' || e.code === 'auth/popup-closed-by-user' || e.code === 'auth/cancelled-popup-request') {
        await auth.signInWithRedirect(provider);
        return null;
      }
      lastAuthError = e;
      throw new Error(formatAuthError(e));
    }
  }

  async function signOut() {
    if (auth) await auth.signOut();
  }

  function onChange(fn) {
    listeners.add(fn);
    fn({ user: currentUser, profile: currentProfile, error: lastAuthError });
    return () => listeners.delete(fn);
  }

  function isAdmin() {
    return currentProfile?.role === 'admin';
  }

  function isSignedIn() {
    return !!currentUser;
  }

  function getLastError() {
    return lastAuthError;
  }

  function getDb() {
    return db;
  }

  return {
    init,
    isConfigured,
    isAuthEnvironmentSupported,
    unsupportedEnvError,
    signInGoogle,
    signOut,
    onChange,
    isAdmin,
    isSignedIn,
    cotizadorMeta,
    formatAuthError,
    getLastError,
    getDb,
    get user() { return currentUser; },
    get profile() { return currentProfile; }
  };
})();
