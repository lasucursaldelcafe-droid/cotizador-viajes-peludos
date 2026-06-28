/**
 * @file Interacciones home — parallax suave en imágenes editoriales
 * @module home-interactive
 */

/**
 * @param {string} selector
 */
export function initParallaxVisual(selector) {
  const root = document.querySelector(selector);
  const img = root?.querySelector('img');
  if (!root || !img) return;

  const finePointer = globalThis.matchMedia?.('(pointer: fine)').matches ?? false;
  const reducedMotion = globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  if (!finePointer || reducedMotion) return;

  let raf = 0;

  const onMove = (e) => {
    if (raf) return;
    raf = requestAnimationFrame(() => {
      raf = 0;
      const rect = root.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      img.style.transform = `scale(1.06) translate(${x * -12}px, ${y * -10}px)`;
    });
  };

  const onLeave = () => {
    img.style.transform = 'scale(1) translate(0, 0)';
  };

  root.addEventListener('mousemove', onMove);
  root.addEventListener('mouseleave', onLeave);
}

/**
 * Hotspots informativos en la imagen del proceso
 */
export function initProcessHotspots() {
  const root = document.querySelector('#ghostProcessVisual');
  if (!root) return;

  const closeAll = () => {
    root.querySelectorAll('[data-panel]').forEach((p) => p.classList.remove('is-open'));
    root.querySelectorAll('[data-hotspot]').forEach((b) => b.setAttribute('aria-expanded', 'false'));
  };

  root.querySelectorAll('[data-hotspot]').forEach((btn) => {
    btn.setAttribute('aria-expanded', 'false');
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.getAttribute('data-hotspot');
      const panel = root.querySelector(`[data-panel="${id}"]`);
      if (!panel) return;
      const open = panel.classList.contains('is-open');
      closeAll();
      if (!open) {
        panel.classList.add('is-open');
        btn.setAttribute('aria-expanded', 'true');
      }
    });
  });

  document.addEventListener('click', (e) => {
    if (!root.contains(/** @type {Node} */ (e.target))) closeAll();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeAll();
  });
}
