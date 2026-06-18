/**
 * Escala la vista previa carta segun ancho disponible (celular, tablet, PC)
 */
const VpResponsive = (function () {
  const LETTER_PX = 816; /* 8.5in @ 96dpi */

  function isMobile() {
    return window.matchMedia('(max-width: 960px)').matches;
  }

  function setMobileTab(tab) {
    document.body.dataset.vpTab = tab;
    document.querySelectorAll('.vp-mobile-nav button').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.tab === tab);
    });
  }

  function scalePreview() {
    const mount = document.getElementById('previewMount');
    const doc = mount?.querySelector('.vp-doc');
    if (!mount || !doc) return;

    const pad = isMobile() ? 8 : 24;
    const available = mount.clientWidth - pad;
    const natural = doc.offsetWidth || LETTER_PX;
    const scale = Math.min(1, available / natural);
    doc.style.setProperty('--vp-preview-scale', String(scale));
    mount.style.setProperty('--vp-scaled-h', `${Math.ceil(natural * scale)}px`);
  }

  function initPreviewObserver() {
    const mount = document.getElementById('previewMount');
    if (!mount) return;

    const ro = new ResizeObserver(() => scalePreview());
    ro.observe(mount);

    const mo = new MutationObserver(() => {
      scalePreview();
      requestAnimationFrame(scalePreview);
    });
    mo.observe(mount, { childList: true, subtree: true });

    window.addEventListener('resize', scalePreview);
    window.addEventListener('orientationchange', () => setTimeout(scalePreview, 120));
    scalePreview();
  }

  function initMobileNav() {
    document.querySelectorAll('.vp-mobile-nav button').forEach((btn) => {
      btn.addEventListener('click', () => setMobileTab(btn.dataset.tab));
    });
    if (isMobile()) setMobileTab('form');
    window.matchMedia('(max-width: 960px)').addEventListener('change', (e) => {
      setMobileTab(e.matches ? 'form' : 'all');
      scalePreview();
    });
  }

  function init() {
    initMobileNav();
    initPreviewObserver();
    document.addEventListener('vp-preview-updated', scalePreview);
  }

  return { init, scalePreview, isMobile, setMobileTab };
})();
