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
    setTimeout(() => el.classList.remove('show'), 4000);
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

  function showEnvBanner(msg) {
    const el = $('envBanner');
    if (!el) return;
    el.textContent = msg;
    el.removeAttribute('hidden');
  }

  function disableLoginForEnv(msg) {
    const btn = $('btnGoogleLogin');
    if (btn) {
      btn.disabled = true;
      btn.title = msg;
    }
    showEnvBanner(msg);
    showToast(msg);
  }

  async function boot() {
    if (!VpAuth.isAuthEnvironmentSupported()) {
      const msg = VpAuth.formatAuthError(VpAuth.unsupportedEnvError());
      disableLoginForEnv(msg);
      return;
    }

    $('btnGoogleLogin')?.addEventListener('click', async () => {
      if (!VpAuth.isAuthEnvironmentSupported()) {
        showToast(VpAuth.formatAuthError(VpAuth.unsupportedEnvError()));
        return;
      }
      if (!VpAuth.isConfigured()) {
        showToast('No se cargo la configuracion. Recarga la pagina.');
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
      showToast('Error: configuracion Firebase no disponible.');
      return;
    }

    showLoading('Verificando sesion...');
    const result = await VpAuth.init();

    if (result.error) {
      showToast(VpAuth.formatAuthError(result.error));
      resetLoginBtn();
    } else {
      resetLoginBtn();
    }

    VpAuth.onChange(({ user, error }) => {
      if (error) showToast(VpAuth.formatAuthError(error));
      if (user) goToApp();
    });

    if (VpAuth.isSignedIn()) goToApp();
  }

  document.addEventListener('DOMContentLoaded', boot);
})();
