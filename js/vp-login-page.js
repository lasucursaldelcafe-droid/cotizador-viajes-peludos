/**
 * Pagina 1: inicio de sesion (index.html)
 */
(function () {
  function $(id) { return document.getElementById(id); }

  function showToast(msg) {
    const el = $('toast');
    if (!el) return;
    el.textContent = msg;
    el.classList.add('show');
    setTimeout(() => el.classList.remove('show'), 2800);
  }

  function goToApp() {
    window.location.href = VP_ROUTES.app;
  }

  function showLocalMode() {
    $('loginConfigured')?.setAttribute('hidden', '');
    $('loginLocal')?.removeAttribute('hidden');
  }

  function showLoginForm() {
    $('loginLocal')?.setAttribute('hidden', '');
    $('loginConfigured')?.removeAttribute('hidden');
  }

  async function boot() {
    $('btnGoogleLogin')?.addEventListener('click', async () => {
      try {
        await VpAuth.signInGoogle();
      } catch (e) {
        showToast(e.message || 'No se pudo iniciar sesion con Google');
      }
    });

    if (!VpAuth.isConfigured()) {
      showLocalMode();
      $('btnEnterLocal')?.addEventListener('click', goToApp);
      return;
    }

    showLoginForm();
    await VpAuth.init();

    VpAuth.onChange(({ user }) => {
      if (user) goToApp();
    });

    if (VpAuth.isSignedIn()) goToApp();
  }

  document.addEventListener('DOMContentLoaded', boot);
})();
