(function () {
  let data = vpCloneDefaults();
  let saveTimer = null;

  const $ = (id) => document.getElementById(id);

  function showToast(msg) {
    const el = $('toast');
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => el.classList.remove('show'), 2600);
  }
  window.vpShowToast = showToast;

  function attachCotizador(data) {
    const meta = typeof VpAuth !== 'undefined' ? VpAuth.cotizadorMeta() : null;
    if (meta) data.cotizador = meta;
    return data;
  }

  let cloudTimer = null;
  function scheduleCloudSave() {
    if (typeof VpQuotesCloud === 'undefined' || !VpAuth.isConfigured() || !VpAuth.isSignedIn()) return;
    clearTimeout(cloudTimer);
    cloudTimer = setTimeout(async () => {
      try {
        attachCotizador(data);
        await VpQuotesCloud.save(data);
        $('saveStatus').title = `Nube + local · ${new Date().toLocaleTimeString('es-CO')}`;
      } catch (e) {
        console.error('Nube:', e);
      }
    }, 1200);
  }

  function scheduleSave() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      attachCotizador(data);
      const at = vpSave(data);
      $('saveStatus').title = `Guardado ${new Date(at).toLocaleTimeString('es-CO')}`;
      scheduleCloudSave();
    }, 350);
  }

  function readForm() {
    data.fecha = $('fFecha').value;
    data.ciudadCarta = $('fCiudadCarta').value.trim();
    data.moneda = $('fMoneda').value;
    data.valor = Number($('fValor').value) || 0;
    data.cliente = $('fCliente').value.trim();
    data.mascota = $('fMascota').value.trim();
    data.origen = $('fOrigen').value.trim();
    data.destino = $('fDestino').value.trim();
    data.incluye = readList('incluyeList');
    data.observaciones = readList('obsList');
    $('rutaPreview').textContent = vpRutaTexto(data) || '—';
    scheduleSave();
    renderPreview();
  }

  function fillForm() {
    $('fCiudadCarta').value = data.ciudadCarta || 'Medellín';
    $('fFecha').value = data.fecha || todayISO();
    $('fMoneda').value = data.moneda || 'USD';
    $('fValor').value = data.valor ?? 0;
    $('fCliente').value = data.cliente || '';
    $('fMascota').value = data.mascota || '';
    $('fOrigen').value = data.origen || '';
    $('fDestino').value = data.destino || '';
    $('rutaPreview').textContent = vpRutaTexto(data) || '—';
    renderList('incluyeList', data.incluye);
    renderList('obsList', data.observaciones);
  }

  function readList(containerId) {
    return [...$(containerId).querySelectorAll('textarea')].map(t => t.value.trim()).filter(Boolean);
  }

  function renderList(containerId, items) {
    const el = $(containerId);
    const arr = items?.length ? items : [''];
    el.innerHTML = arr.map((text, i) => `
      <div class="list-row">
        <textarea data-idx="${i}" placeholder="Texto...">${escapeHtml(text)}</textarea>
        <button type="button" class="btn btn-danger btn-sm" data-del="${i}">✕</button>
      </div>`).join('');

    el.querySelectorAll('textarea').forEach(t => {
      t.addEventListener('input', readForm);
    });
    el.querySelectorAll('[data-del]').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = Number(btn.dataset.del);
        const list = readList(containerId);
        list.splice(idx, 1);
        if (containerId === 'incluyeList') data.incluye = list.length ? list : [''];
        else data.observaciones = list.length ? list : [''];
        fillForm();
        readForm();
      });
    });
  }

  function renderPreview() {
    $('previewMount').innerHTML = vpRenderPreview(data);
    document.dispatchEvent(new CustomEvent('vp-preview-updated'));
  }

  function readFormatoDialog() {
    const fmt = data.formato;
    fmt.documento.titulo = $('fmtTitulo').value;
    fmt.documento.intro = $('fmtIntro').value;
    fmt.documento.servicioTitulo = $('fmtServicio').value;
    fmt.documento.servicioDescripcion = $('fmtServicioDesc').value;
    fmt.documento.cierre = $('fmtCierre').value;
    fmt.documento.etiquetaRuta = $('fmtLblRuta').value;
    fmt.documento.etiquetaValor = $('fmtLblValor').value;
    fmt.empresa.nombre = $('fmtEmpresa').value;
    fmt.empresa.nit = $('fmtNit').value;
  }

  function fillFormatoDialog() {
    const fmt = data.formato;
    const doc = fmt.documento;
    $('fmtTitulo').value = doc.titulo;
    $('fmtIntro').value = doc.intro;
    $('fmtServicio').value = doc.servicioTitulo;
    $('fmtServicioDesc').value = doc.servicioDescripcion;
    $('fmtCierre').value = doc.cierre;
    $('fmtLblRuta').value = doc.etiquetaRuta;
    $('fmtLblValor').value = doc.etiquetaValor;
    $('fmtEmpresa').value = fmt.empresa.nombre;
    $('fmtNit').value = fmt.empresa.nit;
  }

  async function doDoc() {
    readForm();
    const docData = JSON.parse(JSON.stringify(data));
    try {
      await vpPrepareDocAssets(docData);
      const result = vpExportDoc(docData);
      if (result?.method === 'modal') {
        showToast('Toca "Descargar Word" en la ventana');
      } else if (result?.method === 'share') {
        showToast('Elige donde guardar el documento');
      } else {
        showToast('Documento Word listo');
      }
    } catch (e) {
      console.error(e);
      showToast('No se pudo generar el documento');
    }
  }

  function nuevaCotizacion() {
    const fmt = data.formato;
    data = vpCloneDefaults();
    data.formato = fmt;
    if (typeof VpQuotesCloud !== 'undefined') VpQuotesCloud.setCloudId(null);
    fillForm();
    readForm();
    showToast('Nueva cotización');
  }

  function resetTextos() {
    data.formato = JSON.parse(JSON.stringify(VP_DEFAULTS));
    data.incluye = [...VP_DEFAULTS.incluye];
    data.observaciones = [...VP_DEFAULTS.observaciones];
    fillForm();
    readForm();
    showToast('Textos oficiales restaurados');
  }

  async function boot() {
    const allowed = await VpAppAuth.init();
    if (allowed === false) return;

    vpApplyLayoutVars();
    vpApplyEmbeddedAssets();

    if (typeof VpAdmin !== 'undefined') VpAdmin.init();
    if (typeof VpResponsive !== 'undefined') VpResponsive.init();

    const saved = vpLoad();
    if (saved) {
      data = saved;
      if (!data.formato) data.formato = JSON.parse(JSON.stringify(VP_DEFAULTS));
      if (!data.ciudadCarta) data.ciudadCarta = 'Medellín';
      if (data.cloudId && typeof VpQuotesCloud !== 'undefined') VpQuotesCloud.setCloudId(data.cloudId);
    }
    if (typeof VP_EMBEDDED_ASSETS !== 'undefined') {
      data.formato.assets.logo = VP_EMBEDDED_ASSETS.logo;
      data.formato.assets.fondo = VP_EMBEDDED_ASSETS.fondo;
    } else if (data.formato?.assets?.logo?.includes('image1') || data.formato?.assets?.logo?.includes('.pdf')) {
      data.formato.assets.logo = VP_LOGO_PNG;
    }

    $('brandLogo').src = vpLogoSource();

    vpLoadLogo(data.formato)
      .then(() => renderPreview())
      .catch(() => showToast('No se cargó el logo PNG'));

    fillForm();
    renderPreview();

    ['fCiudadCarta','fFecha','fMoneda','fValor','fCliente','fMascota','fOrigen','fDestino'].forEach(id => {
      $(id).addEventListener('input', readForm);
      $(id).addEventListener('change', readForm);
    });

    $('btnAddIncluye').addEventListener('click', () => {
      data.incluye = readList('incluyeList');
      data.incluye.push('');
      renderList('incluyeList', data.incluye);
    });
    $('btnAddObs').addEventListener('click', () => {
      data.observaciones = readList('obsList');
      data.observaciones.push('');
      renderList('obsList', data.observaciones);
    });

    $('btnDoc').addEventListener('click', doDoc);
    $('btnCloseDownload')?.addEventListener('click', () => $('dlgDownload')?.close());
    $('btnPrint').addEventListener('click', () => {
      readForm();
      setTimeout(() => window.print(), 200);
    });

    $('btnFormato').addEventListener('click', () => {
      fillFormatoDialog();
      $('dlgFormato').showModal();
    });
    $('btnCloseFormato').addEventListener('click', () => $('dlgFormato').close());
    $('btnSaveFormato').addEventListener('click', () => {
      readFormatoDialog();
      $('dlgFormato').close();
      readForm();
      showToast('Textos del formato guardados');
    });

    $('btnNueva').addEventListener('click', nuevaCotizacion);
    $('btnResetTextos').addEventListener('click', resetTextos);

    scheduleSave();
  }

  document.addEventListener('DOMContentLoaded', boot);
})();
