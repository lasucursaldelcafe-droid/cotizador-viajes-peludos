function vpRenderPreview(data) {
  const fmt = data.formato || VP_DEFAULTS;
  const doc = fmt.documento;
  const logoSrc = vpGetLogoSrc(fmt);
  const wmSrc = vpGetWatermarkSrc();
  const fechaCarta = vpFormatFechaCarta(data.ciudadCarta, data.fecha);
  const ruta = vpRutaTexto(data);
  const valor = vpFormatValor(data.moneda || 'USD', data.valor);

  const incluyeHtml = (data.incluye || []).map(item =>
    `<li>${escapeHtml(item)}</li>`
  ).join('');

  const obsHtml = (data.observaciones || []).map(item =>
    `<p>${escapeHtml(item)}</p>`
  ).join('');

  const destinatario = data.cliente
    ? `<div class="vp-destinatario">
        <p><strong>Señor(a):</strong> ${escapeHtml(data.cliente)}</p>
        ${data.mascota ? `<p><strong>Mascota:</strong> ${escapeHtml(data.mascota)}</p>` : ''}
      </div>`
    : '';

  return `
    <article class="vp-doc vp-carta vp-membrete">
      <div class="vp-membrete-bg" style="background-image:url('${vpGetFondoSrc(fmt)}')"></div>
      <img class="vp-watermark" src="${wmSrc}" alt="" aria-hidden="true">
      <div class="vp-content">
        <header class="vp-letterhead">
          <img class="vp-logo" src="${logoSrc}" alt="Viajes Peludos">
          <div class="vp-head-rule"></div>
        </header>

        <div class="vp-safe-area">
        <div class="vp-body">
          <p class="vp-fecha-carta">${escapeHtml(fechaCarta)}</p>
          ${destinatario}
          <p class="vp-asunto"><strong>Asunto:</strong> ${escapeHtml(doc.titulo)}</p>
          <p class="vp-saludo">Cordial saludo,</p>
          <p class="vp-intro">${escapeHtml(doc.intro)}</p>

          <div class="vp-dato-row">
            <div class="vp-dato-block">
              <span class="vp-label">${escapeHtml(doc.etiquetaRuta)}</span>
              <span class="vp-highlight">${escapeHtml(ruta)}</span>
            </div>
            <div class="vp-dato-block">
              <span class="vp-label">${escapeHtml(doc.etiquetaValor)}</span>
              <span class="vp-highlight vp-valor">${escapeHtml(valor)}</span>
            </div>
          </div>

          <h2 class="vp-servicio">${escapeHtml(doc.servicioTitulo)}</h2>
          <p class="vp-texto">${escapeHtml(doc.servicioDescripcion)}</p>
          <p class="vp-label vp-label-inline">${escapeHtml(doc.etiquetaIncluye)}</p>
          <ul class="vp-lista">${incluyeHtml}</ul>
          <p class="vp-texto">${escapeHtml(doc.cierre)}</p>

          <h2 class="vp-obs-titulo">${escapeHtml(doc.etiquetaObservaciones)}</h2>
          <div class="vp-obs">${obsHtml}</div>
        </div>

        <div class="vp-cierre-carta">
          <p>Atentamente,</p>
          <footer class="vp-footer">
            <strong>${escapeHtml(fmt.empresa.nombre)}</strong>
            <span>NIT ${escapeHtml(fmt.empresa.nit)}</span>
          </footer>
        </div>
        </div>
      </div>
    </article>`;
}

function vpDrawMembretePage(pdf, fmt, pw, ph) {
  try {
    pdf.addImage(fmt.assets.fondo, 'PNG', 0, 0, pw, ph);
  } catch (_) {}
  try {
    const wm = fmt.assets.logoWatermark || vpGetWatermarkSrc();
    const W = VP_LAYOUT.watermark;
    pdf.addImage(wm, 'PNG', pw * (W.xPct - W.wPct / 2), ph * (W.yPct - W.hPct / 2), pw * W.wPct, ph * W.hPct);
  } catch (_) {}
}

function vpBuildPdf(data) {
  const { jsPDF } = window.jspdf;
  const fmt = data.formato || VP_DEFAULTS;
  const doc = fmt.documento;
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' });
  const pw = pdf.internal.pageSize.getWidth();
  const ph = pdf.internal.pageSize.getHeight();
  const L = VP_LAYOUT.mm;
  const marginX = L.marginX;
  const contentW = pw - marginX * 2;
  const purple = hexToRgb(VP_BRAND.purple);
  const lh = L.lineH;
  let y = L.bodyY;

  vpDrawMembretePage(pdf, fmt, pw, ph);

  const logoSrc = vpGetLogoSrc(fmt);
  try {
    pdf.addImage(logoSrc, vpDetectImageFormat(logoSrc), L.logoX, L.logoY, L.logoW, L.logoH);
  } catch (e) { console.warn('Logo PDF', e); }

  pdf.setDrawColor(...purple);
  pdf.setLineWidth(0.35);
  pdf.line(marginX, L.ruleY, pw - marginX, L.ruleY);

  const pageBottom = ph - L.marginBottom;

  const newPageIfNeeded = (need) => {
    if (y + need > pageBottom) {
      pdf.addPage();
      vpDrawMembretePage(pdf, fmt, pw, ph);
      y = L.bodyY;
      return true;
    }
    return false;
  };

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);
  pdf.setTextColor(45, 45, 45);
  pdf.text(vpFormatFechaCarta(data.ciudadCarta, data.fecha), marginX, y);
  y += lh + 2;

  if (data.cliente) {
    pdf.setFont('helvetica', 'bold');
    pdf.text('Señor(a):', marginX, y);
    pdf.setFont('helvetica', 'normal');
    pdf.text(data.cliente, marginX + 19, y);
    y += lh;
    if (data.mascota) {
      pdf.setFont('helvetica', 'bold');
      pdf.text('Mascota:', marginX, y);
      pdf.setFont('helvetica', 'normal');
      pdf.text(data.mascota, marginX + 16, y);
      y += lh;
    }
    y += 1.5;
  }

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  pdf.setTextColor(...purple);
  const asunto = pdf.splitTextToSize(`Asunto: ${doc.titulo}`, contentW);
  newPageIfNeeded(asunto.length * lh);
  pdf.text(asunto, marginX, y);
  y += asunto.length * lh + 2;

  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(45, 45, 45);
  pdf.text('Cordial saludo,', marginX, y);
  y += lh + 1.5;

  pdf.setFontSize(9.5);
  const introLines = pdf.splitTextToSize(doc.intro, contentW);
  newPageIfNeeded(introLines.length * lh);
  pdf.text(introLines, marginX, y);
  y += introLines.length * lh + 2;

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9.5);
  pdf.setTextColor(...purple);
  pdf.text(doc.etiquetaRuta, marginX, y);
  pdf.text(vpRutaTexto(data), marginX + 20, y);
  y += lh + 1;
  pdf.text(doc.etiquetaValor, marginX, y);
  pdf.setFontSize(11);
  pdf.text(vpFormatValor(data.moneda, data.valor), marginX + 20, y);
  y += lh + 3;

  pdf.setFontSize(9.5);
  pdf.text(doc.servicioTitulo, marginX, y);
  y += lh;
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  pdf.setTextColor(50, 50, 50);
  const servLines = pdf.splitTextToSize(doc.servicioDescripcion, contentW);
  newPageIfNeeded(servLines.length * lh);
  pdf.text(servLines, marginX, y);
  y += servLines.length * lh + 1.5;

  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(...purple);
  pdf.text(doc.etiquetaIncluye, marginX, y);
  y += lh;
  pdf.setFont('helvetica', 'normal');
  (data.incluye || []).forEach(item => {
    const lines = pdf.splitTextToSize(`• ${item}`, contentW - 3);
    newPageIfNeeded(lines.length * lh);
    pdf.text(lines, marginX + 2, y);
    y += lines.length * (lh - 0.3);
  });
  y += 1.5;

  const cierreLines = pdf.splitTextToSize(doc.cierre, contentW);
  newPageIfNeeded(cierreLines.length * lh);
  pdf.text(cierreLines, marginX, y);
  y += cierreLines.length * lh + 2;

  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(...purple);
  pdf.text(doc.etiquetaObservaciones, marginX, y);
  y += lh;
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8.5);
  (data.observaciones || []).forEach(obs => {
    const lines = pdf.splitTextToSize(obs, contentW);
    newPageIfNeeded(lines.length * lh);
    pdf.text(lines, marginX, y);
    y += lines.length * (lh - 0.4) + 1;
  });

  const footerY = L.footerBlockY;
  if (y > footerY - 18) {
    pdf.addPage();
    vpDrawMembretePage(pdf, fmt, pw, ph);
  }

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);
  pdf.setTextColor(45, 45, 45);
  pdf.text('Atentamente,', marginX, footerY);

  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(...purple);
  pdf.text(fmt.empresa.nombre, marginX, footerY + 8);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  pdf.text(`NIT ${fmt.empresa.nit}`, marginX, footerY + 13);

  return pdf;
}

function vpExportPdf(data) {
  const pdf = vpBuildPdf(data);
  const ruta = vpRutaTexto(data).replace(/\s+/g, '-').replace(/[^\w-]/g, '') || 'ruta';
  const filename = `Cotizacion-Viajes-Peludos-${ruta}-${data.fecha || todayISO()}.pdf`;

  if (window.AndroidApp?.savePdf) {
    try {
      const raw = pdf.output('arraybuffer');
      const bytes = new Uint8Array(raw);
      let binary = '';
      for (let i = 0; i < bytes.length; i += 8192) {
        binary += String.fromCharCode.apply(null, bytes.subarray(i, i + 8192));
      }
      window.AndroidApp.savePdf(btoa(binary), filename);
      return;
    } catch (_) { /* fallback */ }
  }
  pdf.save(filename);
}

function vpImageToBase64(url) {
  if (url && url.startsWith('data:')) return Promise.resolve(url);
  return vpLoadImage(url).then(img => {
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    canvas.getContext('2d').drawImage(img, 0, 0);
    return canvas.toDataURL('image/png');
  });
}

async function vpPreparePdfAssets(data) {
  const fmt = data.formato;
  try {
    const logos = await vpLoadLogo(fmt);
    fmt.assets.logoRaster = logos.logo;
    fmt.assets.logoWatermark = logos.watermark;
    const fondoSrc = vpGetFondoSrc(fmt);
    fmt.assets.fondo = fondoSrc.startsWith('data:')
      ? fondoSrc
      : await vpImageToBase64(fondoSrc);
  } catch (e) {
    console.warn('Assets PDF', e);
  }
}
