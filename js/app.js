(function () {
  let template = cloneDefaultTemplate();
  let quote = cloneDefaultQuote();
  let logo = null;
  let saveTimer = null;

  const $ = (id) => document.getElementById(id);

  function showToast(msg) {
    const el = $('toast');
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => el.classList.remove('show'), 2600);
  }

  function scheduleSave() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      const at = saveState(template, quote, logo);
      const st = $('saveStatus');
      if (st) st.title = `Guardado ${new Date(at).toLocaleTimeString('es-CO')}`;
    }, 400);
  }

  function switchTab(name) {
    document.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t.dataset.tab === name));
    document.querySelectorAll('.panel').forEach(p => {
      const on = p.id === `panel-${name}`;
      p.classList.toggle('active', on);
      p.hidden = !on;
    });
    if (name === 'preview') renderPreview();
    if (name === 'cotizacion') renderQuoteForms();
  }

  // ─── Template UI ─────────────────────────────────────────
  function readTemplateFromForm() {
    template.nombre = $('tplNombre').value;
    template.documento.titulo = $('tplTitulo').value;
    template.documento.subtitulo = $('tplSubtitulo').value;
    template.documento.formatoPapel = $('tplPapel').value;
    template.documento.etiquetaNumero = $('lblNumero').value;
    template.documento.etiquetaFecha = $('lblFecha').value;
    template.documento.etiquetaValidez = $('lblValidez').value;
    template.documento.etiquetaElaboro = $('lblElaboro').value;
    template.brand.colorPrimario = $('tplColorPrimario').value;
    template.brand.colorSecundario = $('tplColorSecundario').value;
    template.brand.barraSuperior = $('tplBarra').checked;
    template.emisor.etiquetaSeccion = $('tplEmisorTitulo').value;
    template.cliente.etiquetaSeccion = $('tplClienteTitulo').value;
    template.tabla.etiquetaSeccion = $('tplTablaTitulo').value;
    template.tabla.etiquetaSubtotal = $('lblSubtotal').value;
    template.tabla.etiquetaDescuento = $('lblDescuento').value;
    template.tabla.etiquetaImpuesto = $('lblImpuesto').value;
    template.tabla.etiquetaTotal = $('lblTotal').value;
    template.bloques.introduccion.titulo = $('blkIntroTitulo').value;
    template.bloques.introduccion.texto = $('blkIntroTexto').value;
    template.bloques.condiciones.titulo = $('blkCondTitulo').value;
    template.bloques.condiciones.texto = $('blkCondTexto').value;
    template.bloques.notas.titulo = $('blkNotasTitulo').value;
    template.bloques.notas.texto = $('blkNotasTexto').value;
    template.bloques.piePagina.texto = $('blkPieTexto').value;
    readColumnsFromTable();
    readFieldEditors();
    scheduleSave();
  }

  function fillTemplateForm() {
    $('tplNombre').value = template.nombre || '';
    $('tplTitulo').value = template.documento.titulo || '';
    $('tplSubtitulo').value = template.documento.subtitulo || '';
    $('tplPapel').value = template.documento.formatoPapel || 'letter';
    $('lblNumero').value = template.documento.etiquetaNumero || '';
    $('lblFecha').value = template.documento.etiquetaFecha || '';
    $('lblValidez').value = template.documento.etiquetaValidez || '';
    $('lblElaboro').value = template.documento.etiquetaElaboro || '';
    $('tplColorPrimario').value = template.brand.colorPrimario || '#c41e3a';
    $('tplColorSecundario').value = template.brand.colorSecundario || '#0a0a0a';
    $('tplBarra').checked = !!template.brand.barraSuperior;
    $('tplEmisorTitulo').value = template.emisor.etiquetaSeccion || '';
    $('tplClienteTitulo').value = template.cliente.etiquetaSeccion || '';
    $('tplTablaTitulo').value = template.tabla.etiquetaSeccion || '';
    $('lblSubtotal').value = template.tabla.etiquetaSubtotal || '';
    $('lblDescuento').value = template.tabla.etiquetaDescuento || '';
    $('lblImpuesto').value = template.tabla.etiquetaImpuesto || '';
    $('lblTotal').value = template.tabla.etiquetaTotal || '';
    $('blkIntroTitulo').value = template.bloques.introduccion.titulo || '';
    $('blkIntroTexto').value = template.bloques.introduccion.texto || '';
    $('blkCondTitulo').value = template.bloques.condiciones.titulo || '';
    $('blkCondTexto').value = template.bloques.condiciones.texto || '';
    $('blkNotasTitulo').value = template.bloques.notas.titulo || '';
    $('blkNotasTexto').value = template.bloques.notas.texto || '';
    $('blkPieTexto').value = template.bloques.piePagina.texto || '';
    renderColumnsTable();
    renderFieldEditors();
    renderLogoPreview();
  }

  function renderFieldEditors() {
    renderFieldEditor('emisorFieldsEditor', template.emisor.campos, 'emisor');
    renderFieldEditor('clienteFieldsEditor', template.cliente.campos, 'cliente');
  }

  function renderFieldEditor(containerId, fields, party) {
    const el = $(containerId);
    el.innerHTML = fields.map((f, i) => `
      <div class="field-row" data-party="${party}" data-idx="${i}">
        <span>${f.label} <code>${f.key}</code></span>
        <label class="check"><input type="checkbox" data-f="visible" ${f.visible ? 'checked' : ''}> Form</label>
        <label class="check"><input type="checkbox" data-f="enPdf" ${f.enPdf ? 'checked' : ''}> PDF</label>
      </div>`).join('');
    el.querySelectorAll('input').forEach(inp => {
      inp.addEventListener('change', () => {
        readFieldEditors();
        renderQuoteForms();
        scheduleSave();
      });
    });
  }

  function readFieldEditors() {
    document.querySelectorAll('.field-row').forEach(row => {
      const party = row.dataset.party;
      const idx = Number(row.dataset.idx);
      const list = party === 'emisor' ? template.emisor.campos : template.cliente.campos;
      list[idx].visible = row.querySelector('[data-f="visible"]').checked;
      list[idx].enPdf = row.querySelector('[data-f="enPdf"]').checked;
    });
  }

  function renderColumnsTable() {
    const tbody = $('columnsTable').querySelector('tbody');
    const cols = template.tabla.columnas;
    tbody.innerHTML = cols.map((c, i) => `
      <tr data-idx="${i}">
        <td><input value="${c.key}" data-k="key" ${c.key === 'num' || c.key === 'subtotal' ? 'readonly' : ''}></td>
        <td><input value="${c.label}" data-k="label"></td>
        <td>
          <select data-k="tipo">
            ${['text','number','money','percent','moneyCalc','auto'].map(t =>
              `<option value="${t}" ${c.tipo === t ? 'selected' : ''}>${t}</option>`).join('')}
          </select>
        </td>
        <td><input type="number" min="4" max="60" value="${c.anchoPct}" data-k="anchoPct"></td>
        <td>
          <select data-k="alinear">
            <option value="left" ${c.alinear === 'left' ? 'selected' : ''}>izq</option>
            <option value="center" ${c.alinear === 'center' ? 'selected' : ''}>centro</option>
            <option value="right" ${c.alinear === 'right' ? 'selected' : ''}>der</option>
          </select>
        </td>
        <td>${c.key === 'num' || c.key === 'subtotal' ? '' : `<button type="button" class="btn btn-danger btn-sm" data-del-col="${i}">✕</button>`}</td>
      </tr>`).join('');

    tbody.querySelectorAll('input, select').forEach(inp => {
      inp.addEventListener('input', () => { readColumnsFromTable(); renderQuoteLinesTable(); scheduleSave(); });
      inp.addEventListener('change', () => { readColumnsFromTable(); renderQuoteLinesTable(); scheduleSave(); });
    });
    tbody.querySelectorAll('[data-del-col]').forEach(btn => {
      btn.addEventListener('click', () => {
        template.tabla.columnas.splice(Number(btn.dataset.delCol), 1);
        renderColumnsTable();
        renderQuoteLinesTable();
        scheduleSave();
      });
    });
  }

  function readColumnsFromTable() {
    const rows = $('columnsTable').querySelectorAll('tbody tr');
    rows.forEach(row => {
      const i = Number(row.dataset.idx);
      const c = template.tabla.columnas[i];
      row.querySelectorAll('[data-k]').forEach(inp => {
        const k = inp.dataset.k;
        c[k] = inp.type === 'number' ? Number(inp.value) : inp.value;
      });
    });
  }

  function addColumn() {
    template.tabla.columnas.push({
      key: 'campo' + (template.tabla.columnas.length + 1),
      label: 'Nuevo campo',
      tipo: 'text',
      anchoPct: 10,
      alinear: 'left'
    });
    renderColumnsTable();
    renderQuoteLinesTable();
    scheduleSave();
  }

  // ─── Quote UI ───────────────────────────────────────────
  function readQuoteFromForm() {
    quote.meta.numero = $('qNumero').value;
    quote.meta.fecha = $('qFecha').value;
    quote.meta.validaHasta = $('qValida').value;
    quote.meta.elaboro = $('qElaboro').value;
    quote.totales.descuentoGlobalPct = Number($('qDescGlobal').value) || 0;
    quote.totales.impuestoPct = Number($('qImpuesto').value) || 0;
    quote.bloques.introduccion = $('qIntro').value;
    quote.bloques.condiciones = $('qCond').value;
    quote.bloques.notas = $('qNotas').value;

    document.querySelectorAll('[data-party-field]').forEach(inp => {
      const [party, key] = inp.dataset.partyField.split('.');
      quote[party][key] = inp.value;
    });
    readLinesFromTable();
    scheduleSave();
  }

  function fillQuoteForm() {
    $('qNumero').value = quote.meta.numero || '';
    $('qFecha').value = quote.meta.fecha || todayISO();
    $('qValida').value = quote.meta.validaHasta || addDaysISO(30);
    $('qElaboro').value = quote.meta.elaboro || '';
    $('qDescGlobal').value = quote.totales.descuentoGlobalPct ?? 0;
    $('qImpuesto').value = quote.totales.impuestoPct ?? template.tabla.impuestoPct ?? 0;
    $('qIntro').value = quote.bloques.introduccion || '';
    $('qCond').value = quote.bloques.condiciones || '';
    $('qNotas').value = quote.bloques.notas || '';
    if (!quote.meta.numero) $('qNumero').value = 'COT-' + new Date().getFullYear() + '-' + String(Date.now()).slice(-4);
  }

  function renderQuoteForms() {
    const buildCard = (party, section) => {
      const fields = (section.campos || []).filter(f => f.visible);
      const title = section.etiquetaSeccion || party.toUpperCase();
      const inputs = fields.map(f => `
        <label>${f.label}
          <input type="text" data-party-field="${party}.${f.key}" value="${quote[party]?.[f.key] || ''}">
        </label>`).join('');
      return `<h2>${title}</h2><div class="form-grid">${inputs || '<p>Sin campos visibles</p>'}</div>`;
    };
    $('cardEmisor').innerHTML = buildCard('emisor', template.emisor);
    $('cardCliente').innerHTML = buildCard('cliente', template.cliente);
    $('cardEmisor').querySelectorAll('input').forEach(i => i.addEventListener('input', readQuoteFromForm));
    $('cardCliente').querySelectorAll('input').forEach(i => i.addEventListener('input', readQuoteFromForm));
    renderQuoteLinesTable();
    fillQuoteForm();
    document.querySelectorAll('#panel-cotizacion input, #panel-cotizacion textarea').forEach(el => {
      if (!el.dataset.partyField) {
        el.removeEventListener('input', readQuoteFromForm);
        el.addEventListener('input', readQuoteFromForm);
        el.removeEventListener('change', readQuoteFromForm);
        el.addEventListener('change', readQuoteFromForm);
      }
    });
  }

  function renderQuoteLinesTable() {
    const cols = template.tabla.columnas.filter(c => c.key !== 'num' && c.key !== 'subtotal' && c.tipo !== 'moneyCalc');
    const thead = $('linesTable').querySelector('thead');
    const tbody = $('linesTable').querySelector('tbody');
    thead.innerHTML = `<tr>${cols.map(c => `<th>${c.label}</th>`).join('')}<th></th></tr>`;

    if (!quote.lineas.length) quote.lineas.push({ codigo: '', descripcion: '', unidad: 'und', cantidad: 1, precioUnit: 0, descuentoPct: 0 });

    tbody.innerHTML = quote.lineas.map((line, ri) => `
      <tr data-line="${ri}">
        ${cols.map(c => {
          const val = line[c.key] ?? (c.tipo === 'number' || c.tipo === 'money' || c.tipo === 'percent' ? 0 : '');
          const type = c.tipo === 'number' || c.tipo === 'money' || c.tipo === 'percent' ? 'number' : 'text';
          const step = c.tipo === 'money' ? '100' : c.tipo === 'percent' ? '0.1' : '1';
          return `<td><input type="${type}" data-line-k="${c.key}" value="${val}" ${type === 'number' ? `step="${step}" min="0"` : ''}></td>`;
        }).join('')}
        <td><button type="button" class="btn btn-danger btn-sm" data-del-line="${ri}">✕</button></td>
      </tr>`).join('');

    tbody.querySelectorAll('input').forEach(inp => {
      inp.addEventListener('input', readQuoteFromForm);
    });
    tbody.querySelectorAll('[data-del-line]').forEach(btn => {
      btn.addEventListener('click', () => {
        if (quote.lineas.length <= 1) return;
        quote.lineas.splice(Number(btn.dataset.delLine), 1);
        renderQuoteLinesTable();
        scheduleSave();
      });
    });
  }

  function readLinesFromTable() {
    const cols = template.tabla.columnas.filter(c => c.key !== 'num' && c.key !== 'subtotal' && c.tipo !== 'moneyCalc');
    $('linesTable').querySelectorAll('tbody tr').forEach(row => {
      const i = Number(row.dataset.line);
      cols.forEach(c => {
        const inp = row.querySelector(`[data-line-k="${c.key}"]`);
        if (!inp) return;
        quote.lineas[i][c.key] = c.tipo === 'number' || c.tipo === 'money' || c.tipo === 'percent'
          ? Number(inp.value) || 0
          : inp.value;
      });
    });
  }

  function addLine() {
    quote.lineas.push({ codigo: '', descripcion: '', unidad: 'und', cantidad: 1, precioUnit: 0, descuentoPct: 0 });
    renderQuoteLinesTable();
    scheduleSave();
  }

  // ─── Logo ───────────────────────────────────────────────
  function renderLogoPreview() {
    const preview = $('logoPreview');
    if (logo) {
      preview.innerHTML = `<img src="${logo}" alt="Logo">`;
      preview.classList.remove('empty');
    } else {
      preview.innerHTML = 'Sin logo';
      preview.classList.add('empty');
    }
  }

  function handleLogoUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      logo = reader.result;
      renderLogoPreview();
      scheduleSave();
      renderPreview();
    };
    reader.readAsDataURL(file);
  }

  // ─── Preview / PDF ──────────────────────────────────────
  function renderPreview() {
    readTemplateFromForm();
    readQuoteFromForm();
    $('previewMount').innerHTML = renderPreviewHtml(template, quote, logo);
  }

  function doPdf() {
    readTemplateFromForm();
    readQuoteFromForm();
    if (!window.jspdf) {
      showToast('Cargando librería PDF… intenta de nuevo');
      return;
    }
    exportPdf(template, quote, logo);
    showToast('PDF generado');
  }

  function doPrint() {
    switchTab('preview');
    setTimeout(() => window.print(), 300);
  }

  function downloadJson(filename, text) {
    const blob = new Blob([text], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function exportTemplate() {
    readTemplateFromForm();
    downloadJson(`plantilla-${template.nombre || 'cotizador'}.json`, exportTemplateJson(template, logo));
    showToast('Plantilla exportada');
  }

  function importTemplate(file) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const { template: t, logo: l } = importTemplateJson(reader.result);
        template = t;
        if (l) logo = l;
        fillTemplateForm();
        renderQuoteForms();
        renderPreview();
        scheduleSave();
        showToast('Plantilla importada');
      } catch (err) {
        showToast('JSON inválido: ' + err.message);
      }
    };
    reader.readAsText(file);
  }

  // ─── Init ───────────────────────────────────────────────
  function init() {
    const saved = loadState();
    if (saved?.template) template = saved.template;
    if (saved?.quote) quote = saved.quote;
    if (saved?.logo) logo = saved.logo;

    if (!quote.meta.fecha) quote.meta.fecha = todayISO();
    if (!quote.meta.validaHasta) quote.meta.validaHasta = addDaysISO(30);

    fillTemplateForm();
    fillQuoteForm();
    renderQuoteForms();

    document.querySelectorAll('.tab').forEach(t => {
      t.addEventListener('click', () => switchTab(t.dataset.tab));
    });

    document.querySelectorAll('#panel-plantilla input, #panel-plantilla select, #panel-plantilla textarea').forEach(el => {
      el.addEventListener('input', () => { readTemplateFromForm(); });
      el.addEventListener('change', () => { readTemplateFromForm(); });
    });

    $('btnAddColumn').addEventListener('click', addColumn);
    $('btnAddLine').addEventListener('click', addLine);
    $('logoInput').addEventListener('change', handleLogoUpload);
    $('btnRemoveLogo').addEventListener('click', () => {
      logo = null;
      $('logoInput').value = '';
      renderLogoPreview();
      scheduleSave();
    });

    $('btnPdf').addEventListener('click', doPdf);
    $('btnPdf2').addEventListener('click', doPdf);
    $('btnPrint').addEventListener('click', doPrint);
    $('btnExportTpl').addEventListener('click', exportTemplate);
    $('btnExportTpl2').addEventListener('click', exportTemplate);
    $('btnImportTpl').addEventListener('click', () => $('importFile').click());
    $('importFile').addEventListener('change', (e) => {
      const f = e.target.files[0];
      if (f) importTemplate(f);
      e.target.value = '';
    });

    scheduleSave();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
