function hexToRgb(hex) {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map(c => c + c).join('') : h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function formatMoney(n, template) {
  if (!Number.isFinite(n)) n = 0;
  const locale = template?.documento?.locale || 'es-CO';
  const prefix = template?.documento?.prefijoMoneda || '$';
  return prefix + Math.round(n).toLocaleString(locale);
}

function formatDate(d) {
  if (!d) return '—';
  const dt = new Date(d + 'T12:00:00');
  return dt.toLocaleDateString('es-CO', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

function calcLineSubtotal(line) {
  const qty = Number(line.cantidad) || 0;
  const price = Number(line.precioUnit) || 0;
  const disc = Number(line.descuentoPct) || 0;
  const gross = qty * price;
  return gross * (1 - disc / 100);
}

function computeTotals(quote, template) {
  const lineas = (quote.lineas || []).map((l, i) => ({
    ...l,
    num: i + 1,
    subtotal: calcLineSubtotal(l)
  }));
  const subtotal = lineas.reduce((s, l) => s + l.subtotal, 0);
  const descPct = Number(quote.totales?.descuentoGlobalPct ?? template.tabla?.descuentoGlobalPct) || 0;
  const taxPct = Number(quote.totales?.impuestoPct ?? template.tabla?.impuestoPct) || 0;
  const descuento = subtotal * (descPct / 100);
  const base = subtotal - descuento;
  const impuesto = base * (taxPct / 100);
  const total = base + impuesto;
  return { lineas, subtotal, descuento, descPct, impuesto, taxPct, total };
}

function getBlockText(quote, template, key) {
  const q = quote.bloques?.[key];
  if (q && String(q).trim()) return q;
  const t = template.bloques?.[key];
  return t?.texto || '';
}

function renderPreviewHtml(template, quote, logo) {
  const doc = template.documento || {};
  const brand = template.brand || {};
  const computed = computeTotals(quote, template);
  const primary = brand.colorPrimario || '#c41e3a';
  const secondary = brand.colorSecundario || '#0a0a0a';

  const emisorFields = (template.emisor?.campos || []).filter(f => f.visible && f.enPdf);
  const clienteFields = (template.cliente?.campos || []).filter(f => f.visible && f.enPdf);
  const cols = template.tabla?.columnas || [];

  const emisorHtml = emisorFields.map(f => {
    const v = quote.emisor?.[f.key];
    if (!v) return '';
    return `<div class="pv-field"><span class="pv-label">${f.label}:</span> ${escapeHtml(v)}</div>`;
  }).join('');

  const clienteHtml = clienteFields.map(f => {
    const v = quote.cliente?.[f.key];
    if (!v) return '';
    return `<div class="pv-field"><span class="pv-label">${f.label}:</span> ${escapeHtml(v)}</div>`;
  }).join('');

  const thead = cols.map(c => `<th style="width:${c.anchoPct}%">${escapeHtml(c.label)}</th>`).join('');

  const tbody = computed.lineas.map(line => {
    const cells = cols.map(col => {
      let val = '';
      if (col.key === 'num') val = line.num;
      else if (col.key === 'subtotal' || col.tipo === 'moneyCalc') val = formatMoney(line.subtotal, template);
      else if (col.tipo === 'money') val = formatMoney(Number(line[col.key]) || 0, template);
      else if (col.tipo === 'percent') val = (Number(line[col.key]) || 0) + '%';
      else val = line[col.key] ?? '';
      return `<td class="align-${col.alinear || 'left'}">${escapeHtml(String(val))}</td>`;
    }).join('');
    return `<tr>${cells}</tr>`;
  }).join('');

  const intro = getBlockText(quote, template, 'introduccion');
  const cond = getBlockText(quote, template, 'condiciones');
  const notas = getBlockText(quote, template, 'notas');
  const pie = template.bloques?.piePagina?.texto || '';

  const logoHtml = logo
    ? `<img src="${logo}" alt="Logo" class="pv-logo">`
    : '<div class="pv-logo-placeholder">LOGO</div>';

  return `
    <article class="preview-doc" style="--pv-primary:${primary};--pv-secondary:${secondary}">
      ${brand.barraSuperior ? '<div class="pv-top-bar"><span class="pv-bar-main"></span><span class="pv-bar-accent"></span></div>' : ''}
      <header class="pv-header">
        ${logoHtml}
        <div class="pv-header-text">
          <h1>${escapeHtml(quote.emisor?.nombre || doc.titulo)}</h1>
          <p class="pv-sub">${escapeHtml(doc.subtitulo || '')}</p>
          ${quote.emisor?.direccion ? `<p class="pv-meta">${escapeHtml(quote.emisor.direccion)}</p>` : ''}
          <p class="pv-meta">${[quote.emisor?.telefono, quote.emisor?.email].filter(Boolean).map(escapeHtml).join(' · ')}</p>
        </div>
      </header>
      <div class="pv-divider"></div>
      <section class="pv-meta-grid">
        <div><strong>${escapeHtml(doc.etiquetaNumero)}:</strong> ${escapeHtml(quote.meta?.numero || '—')}</div>
        <div><strong>${escapeHtml(doc.etiquetaFecha)}:</strong> ${formatDate(quote.meta?.fecha)}</div>
        <div><strong>${escapeHtml(doc.etiquetaValidez)}:</strong> ${formatDate(quote.meta?.validaHasta)}</div>
        <div><strong>${escapeHtml(doc.etiquetaElaboro)}:</strong> ${escapeHtml(quote.meta?.elaboro || '—')}</div>
      </section>
      <div class="pv-columns">
        <section class="pv-box">
          <h3>${escapeHtml(template.emisor?.etiquetaSeccion || 'EMISOR')}</h3>
          ${emisorHtml || '<p class="pv-empty">—</p>'}
        </section>
        <section class="pv-box">
          <h3>${escapeHtml(template.cliente?.etiquetaSeccion || 'CLIENTE')}</h3>
          ${clienteHtml || '<p class="pv-empty">—</p>'}
        </section>
      </div>
      ${template.bloques?.introduccion?.visible && intro ? `
        <section class="pv-block">
          <h3>${escapeHtml(template.bloques.introduccion.titulo)}</h3>
          <p>${escapeHtml(intro).replace(/\n/g, '<br>')}</p>
        </section>` : ''}
      <section class="pv-block">
        <h3>${escapeHtml(template.tabla?.etiquetaSeccion || 'DETALLE')}</h3>
        <table class="pv-table">
          <thead><tr>${thead}</tr></thead>
          <tbody>${tbody || '<tr><td colspan="' + cols.length + '">Sin ítems</td></tr>'}</tbody>
        </table>
        ${template.tabla?.mostrarTotales ? `
          <div class="pv-totals">
            <div><span>${escapeHtml(template.tabla.etiquetaSubtotal)}</span><strong>${formatMoney(computed.subtotal, template)}</strong></div>
            ${computed.descPct ? `<div><span>${escapeHtml(template.tabla.etiquetaDescuento)} (${computed.descPct}%)</span><strong>-${formatMoney(computed.descuento, template)}</strong></div>` : ''}
            ${computed.taxPct ? `<div><span>${escapeHtml(template.tabla.etiquetaImpuesto)} (${computed.taxPct}%)</span><strong>${formatMoney(computed.impuesto, template)}</strong></div>` : ''}
            <div class="pv-total-final"><span>${escapeHtml(template.tabla.etiquetaTotal)}</span><strong>${formatMoney(computed.total, template)}</strong></div>
          </div>` : ''}
      </section>
      ${template.bloques?.condiciones?.visible && cond ? `
        <section class="pv-block">
          <h3>${escapeHtml(template.bloques.condiciones.titulo)}</h3>
          <p>${escapeHtml(cond).replace(/\n/g, '<br>')}</p>
        </section>` : ''}
      ${template.bloques?.notas?.visible ? `
        <section class="pv-block">
          <h3>${escapeHtml(template.bloques.notas.titulo)}</h3>
          <p>${escapeHtml(notas || quote.totales?.notasPie || '').replace(/\n/g, '<br>') || '—'}</p>
        </section>` : ''}
      ${template.bloques?.firma?.visible ? `
        <div class="pv-signatures">
          <div class="pv-sign"><div class="pv-sign-line"></div><span>${escapeHtml(template.bloques.firma.etiquetaEmisor)}</span></div>
          <div class="pv-sign"><div class="pv-sign-line"></div><span>${escapeHtml(template.bloques.firma.etiquetaCliente)}</span></div>
        </div>` : ''}
      ${template.bloques?.piePagina?.visible && pie ? `<footer class="pv-footer">${escapeHtml(pie)}</footer>` : ''}
    </article>`;
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
