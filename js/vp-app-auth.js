/**
 * Pagina 2: proteger editor (app.html) y barra de usuario
 */
const VpAppAuth = (function () {
  function $(id) { return document.getElementById(id); }

  function goLogin() {
    window.location.replace(VP_ROUTES.login);
  }

  function updateBar({ user, profile }) {
    if (!user) {
      goLogin();
      return;
    }
    $('authUserName').textContent = profile?.displayName || user.displayName || user.email;
    $('authUserRole').textContent = profile?.role === 'admin' ? 'Administrador' : 'Cotizador';
    const img = $('authUserPhoto');
    if (user.photoURL && img) {
      img.src = user.photoURL;
      img.removeAttribute('hidden');
    } else if (img) {
      img.setAttribute('hidden', '');
    }
    const badge = $('cotizadorBadge');
    if (badge) {
      badge.textContent = `Cotizador: ${profile?.displayName || user.email}`;
      badge.removeAttribute('hidden');
    }
    const btnAdmin = $('btnAdmin');
    if (btnAdmin) btnAdmin.hidden = profile?.role !== 'admin';
  }

  async function initLocal() {
    $('authBar')?.setAttribute('hidden', '');
    $('authConfigHint')?.removeAttribute('hidden');
    return true;
  }

  async function init() {
    $('btnLogout')?.addEventListener('click', async () => {
      if (VpAuth.isConfigured()) await VpAuth.signOut();
      goLogin();
    });

    if (!VpAuth.isConfigured()) {
      return initLocal();
    }

    $('authConfigHint')?.setAttribute('hidden', '');
    await VpAuth.init();

    if (!VpAuth.isSignedIn()) {
      goLogin();
      return false;
    }

    VpAuth.onChange(updateBar);
    updateBar({ user: VpAuth.user, profile: VpAuth.profile });
    return true;
  }

  return { init, goLogin };
})();
