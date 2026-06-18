/**
 * UI de inicio de sesion Google y barra de usuario
 */
const VpAuthUi = (function () {
  function $(id) { return document.getElementById(id); }

  function updateBar({ user, profile }) {
    const signedIn = !!user;
    const gate = $('authGate');
    const bar = $('authBar');
    const app = $('vpAppRoot');

    if (!VpAuth.isConfigured()) {
      gate?.setAttribute('hidden', '');
      bar?.setAttribute('hidden', '');
      app?.removeAttribute('hidden');
      $('authConfigHint')?.removeAttribute('hidden');
      return;
    }

    $('authConfigHint')?.setAttribute('hidden', '');

    if (signedIn) {
      gate?.setAttribute('hidden', '');
      app?.removeAttribute('hidden');
      bar?.removeAttribute('hidden');
      $('authUserName').textContent = profile?.displayName || user.displayName || user.email;
      $('authUserRole').textContent = profile?.role === 'admin' ? 'Administrador' : 'Cotizador';
      $('authUserEmail').textContent = user.email || '';
      const img = $('authUserPhoto');
      if (user.photoURL) {
        img.src = user.photoURL;
        img.removeAttribute('hidden');
      } else {
        img.setAttribute('hidden', '');
      }
      $('cotizadorBadge').textContent = `Cotizador: ${profile?.displayName || user.email}`;
      $('cotizadorBadge')?.removeAttribute('hidden');
    } else {
      gate?.removeAttribute('hidden');
      app?.setAttribute('hidden', '');
      bar?.setAttribute('hidden', '');
      $('cotizadorBadge')?.setAttribute('hidden', '');
    }
  }

  async function init() {
    $('btnGoogleLogin')?.addEventListener('click', async () => {
      try {
        await VpAuth.signInGoogle();
      } catch (e) {
        window.vpShowToast?.(e.message || 'No se pudo iniciar sesion con Google');
      }
    });
    $('btnLogout')?.addEventListener('click', async () => {
      await VpAuth.signOut();
      window.vpShowToast?.('Sesion cerrada');
    });

    if (!VpAuth.isConfigured()) return;
    await VpAuth.init();
    VpAuth.onChange(updateBar);
  }

  return { init, updateBar };
})();
