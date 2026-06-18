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
    window.location.replace(VP_ROUTES.app);
  }

  function showLoading(msg) {
    const btn = $('btnGoogleLogin');
    if (btn) {
      btn.disabled = true;
      btn.dataset.prevText = btn.innerHTML;
      btn.textContent = msg || 'Conectando...';
    }
  }

  function resetLoginBtn() {
    const btn = $('btnGoogleLogin');
    if (btn && btn.dataset.prevText) {
      btn.disabled = false;
      btn.innerHTML = btn.dataset.prevText;
    }
  }

  async function boot() {
    $('btnGoogleLogin')?.addEventListener('click', async () => {
      if (!VpAuth.isConfigured()) {
        showToast('No se cargó la configuración. Recarga la página.');
        return;
      }
      try {
        showLoading('Abriendo Google...');
        const user = await VpAuth.signInGoogle();
        if (user) goToApp();
      } catch (e) {
        showToast(e.message || 'No se pudo iniciar sesion con Google');
        resetLoginBtn();
      }
    });

    if (!VpAuth.isConfigured()) {
      showToast('Cargando configuración...');
      return;
    }

    await VpAuth.init();

    VpAuth.onChange(({ user }) => {
      if (user) goToApp();
    });

    if (VpAuth.isSignedIn()) goToApp();
  }

  document.addEventListener('DOMContentLoaded', boot);
})();
