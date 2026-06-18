/**
 * Panel administrativo: usuarios y cotizaciones por cotizador
 */
const VpAdmin = (function () {
  function $(id) { return document.getElementById(id); }

  function fmtDate(ts) {
    if (!ts) return '—';
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' });
  }

  async function loadUsers() {
    if (!VpAuth.isAdmin()) return [];
    const db = VpAuth.getDb();
    const snap = await db.collection('users').orderBy('createdAt', 'desc').limit(100).get();
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  }

  async function setUserRole(uid, role) {
    if (!VpAuth.isAdmin()) throw new Error('Sin permisos');
    await VpAuth.getDb().collection('users').doc(uid).update({ role });
  }

  async function renderUsers() {
    const el = $('adminUsersList');
    if (!el) return;
    el.innerHTML = '<p class="vp-muted">Cargando usuarios...</p>';
    try {
      const users = await loadUsers();
      if (!users.length) {
        el.innerHTML = '<p class="vp-muted">Sin usuarios registrados.</p>';
        return;
      }
      el.innerHTML = users.map((u) => `
        <div class="vp-admin-row">
          <div class="vp-admin-user">
            ${u.photoURL ? `<img src="${escapeHtml(u.photoURL)}" alt="" class="vp-admin-avatar">` : ''}
            <div>
              <strong>${escapeHtml(u.displayName || u.email)}</strong>
              <span class="vp-muted">${escapeHtml(u.email)}</span>
            </div>
          </div>
          <select data-uid="${escapeHtml(u.uid)}" class="vp-role-select" ${u.uid === VpAuth.user?.uid ? 'disabled' : ''}>
            <option value="cotizador" ${u.role === 'cotizador' ? 'selected' : ''}>Cotizador</option>
            <option value="admin" ${u.role === 'admin' ? 'selected' : ''}>Administrador</option>
          </select>
        </div>`).join('');

      el.querySelectorAll('.vp-role-select').forEach((sel) => {
        sel.addEventListener('change', async () => {
          try {
            await setUserRole(sel.dataset.uid, sel.value);
            window.vpShowToast?.('Rol actualizado');
          } catch (e) {
            window.vpShowToast?.(e.message || 'Error al cambiar rol');
            renderUsers();
          }
        });
      });
    } catch (e) {
      el.innerHTML = `<p class="vp-muted">Error: ${escapeHtml(e.message)}</p>`;
    }
  }

  async function renderQuotes() {
    const el = $('adminQuotesList');
    if (!el) return;
    el.innerHTML = '<p class="vp-muted">Cargando cotizaciones...</p>';
    try {
      const quotes = await VpQuotesCloud.listAll(40);
      if (!quotes.length) {
        el.innerHTML = '<p class="vp-muted">Sin cotizaciones en la nube.</p>';
        return;
      }
      el.innerHTML = quotes.map((q) => `
        <div class="vp-admin-quote">
          <div>
            <strong>${escapeHtml(q.summary?.cliente || 'Sin cliente')}</strong>
            <span class="vp-muted">${escapeHtml(q.summary?.ruta || '')}</span>
          </div>
          <div class="vp-muted vp-admin-meta">
            <span>${escapeHtml(q.cotizador?.displayName || q.cotizador?.email || '—')}</span>
            <span>${fmtDate(q.updatedAt || q.createdAt)}</span>
            <span>${escapeHtml((q.summary?.moneda || '') + ' ' + (q.summary?.valor ?? ''))}</span>
          </div>
        </div>`).join('');
    } catch (e) {
      el.innerHTML = `<p class="vp-muted">Error: ${escapeHtml(e.message)}</p>`;
    }
  }

  async function open() {
    if (!VpAuth.isAdmin()) {
      window.vpShowToast?.('Solo administradores');
      return;
    }
    $('dlgAdmin')?.showModal();
    await Promise.all([renderUsers(), renderQuotes()]);
  }

  function init() {
    $('btnAdmin')?.addEventListener('click', open);
    $('btnCloseAdmin')?.addEventListener('click', () => $('dlgAdmin')?.close());
    VpAuth.onChange(({ profile }) => {
      const btn = $('btnAdmin');
      if (btn) btn.hidden = profile?.role !== 'admin';
    });
  }

  return { init, open };
})();
