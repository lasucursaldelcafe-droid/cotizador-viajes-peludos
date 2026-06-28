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
  if (!finePointer) return;

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

  root.querySelectorAll('[data-hotspot]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-hotspot');
      const panel = root.querySelector(`[data-panel="${id}"]`);
      if (!panel) return;
      const open = panel.classList.contains('is-open');
      root.querySelectorAll('[data-panel]').forEach((p) => p.classList.remove('is-open'));
      if (!open) panel.classList.add('is-open');
    });
  });
}
