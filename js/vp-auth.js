/**
 * Autenticacion Google via Firebase + roles admin / cotizador
 */
const VpAuth = (function () {
  let app = null;
  let auth = null;
  let db = null;
  let currentUser = null;
  let currentProfile = null;
  const listeners = new Set();

  function isConfigured() {
    const c = typeof VP_FIREBASE_CONFIG !== 'undefined' ? VP_FIREBASE_CONFIG : null;
    return !!(c && c.enabled && c.apiKey && c.projectId);
  }

  function notify() {
    listeners.forEach((fn) => {
      try { fn({ user: currentUser, profile: currentProfile }); } catch (e) { console.error(e); }
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
    await db.collection('users').doc(user.uid).update({
      lastLoginAt: firebase.firestore.FieldValue.serverTimestamp(),
      displayName: user.displayName || user.email || 'Usuario',
      photoURL: user.photoURL || ''
    });
    const snap = await db.collection('users').doc(user.uid).get();
    currentProfile = snap.data();
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

  async function init() {
    if (!isConfigured()) return { configured: false };
    if (typeof firebase === 'undefined') throw new Error('Firebase SDK no cargado');

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
    auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL).catch(() => {});

    try {
      await auth.getRedirectResult();
    } catch (e) {
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
            notify();
          } catch (e) {
            console.error('Perfil usuario:', e);
          }
        }
        if (!resolved) {
          resolved = true;
          resolve({ configured: true, user: currentUser, profile: currentProfile });
        }
      });
    });
  }

  function preferRedirect() {
    return /Android|iPhone|iPad|iPod|Mobile|webOS|BlackBerry/i.test(navigator.userAgent)
      || (window.matchMedia && window.matchMedia('(max-width: 768px)').matches);
  }

  async function signInGoogle() {
    if (!auth) throw new Error('Auth no inicializado');
    const provider = new firebase.auth.GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    if (preferRedirect()) {
      await auth.signInWithRedirect(provider);
      return null;
    }
    const cred = await auth.signInWithPopup(provider);
    return cred.user;
  }

  async function signOut() {
    if (auth) await auth.signOut();
  }

  function onChange(fn) {
    listeners.add(fn);
    fn({ user: currentUser, profile: currentProfile });
    return () => listeners.delete(fn);
  }

  function isAdmin() {
    return currentProfile?.role === 'admin';
  }

  function isSignedIn() {
    return !!currentUser;
  }

  function getDb() {
    return db;
  }

  return {
    init,
    isConfigured,
    signInGoogle,
    signOut,
    onChange,
    isAdmin,
    isSignedIn,
    cotizadorMeta,
    getDb,
    get user() { return currentUser; },
    get profile() { return currentProfile; }
  };
})();
