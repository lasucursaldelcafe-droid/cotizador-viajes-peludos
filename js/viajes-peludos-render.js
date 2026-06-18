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
          <div class="vp-logo-wrap">
            <img class="vp-logo" src="${logoSrc}" alt="Viajes Peludos">
          </div>
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
  const logoX = (pw - L.logoW) / 2;
  try {
    pdf.addImage(logoSrc, vpDetectImageFormat(logoSrc), logoX, L.logoY, L.logoW, L.logoH);
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

/** Mismos assets embebidos para Word (.doc) */
const vpPrepareDocAssets = vpPreparePdfAssets;

function vpBuildDocHtml(data) {
  const fmt = data.formato || VP_DEFAULTS;
  const doc = fmt.documento;
  const logoSrc = vpGetLogoSrc(fmt);
  const fondoSrc = vpGetFondoSrc(fmt);
  const fechaCarta = vpFormatFechaCarta(data.ciudadCarta, data.fecha);
  const ruta = vpRutaTexto(data);
  const valor = vpFormatValor(data.moneda || 'USD', data.valor);
  const purple = VP_BRAND.purple;

  const incluyeHtml = (data.incluye || []).map((item) =>
    `<li style="margin-bottom:4pt;text-align:justify;">${escapeHtml(item)}</li>`
  ).join('');

  const obsHtml = (data.observaciones || []).map((item) =>
    `<p style="margin:0 0 6pt;text-align:justify;font-size:9pt;color:#444;">${escapeHtml(item)}</p>`
  ).join('');

  const destinatario = data.cliente
    ? `<p style="margin:0 0 6pt;"><b>Señor(a):</b> ${escapeHtml(data.cliente)}</p>
       ${data.mascota ? `<p style="margin:0 0 6pt;"><b>Mascota:</b> ${escapeHtml(data.mascota)}</p>` : ''}`
    : '';

  return `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:w="urn:schemas-microsoft-com:office:word"
      xmlns="http://www.w3.org/TR/REC-html40">
<head>
<meta charset="utf-8">
<meta name="ProgId" content="Word.Document">
<meta name="Generator" content="Viajes Peludos Cotizador">
<!--[if gte mso 9]><xml>
<w:WordDocument><w:View>Print</w:View><w:Zoom>100</w:Zoom></w:WordDocument>
</xml><![endif]-->
<style>
@page Section1 { size: 8.5in 11in; margin: 0.5in 1in 1.2in 1in; mso-page-orientation: portrait; }
div.Section1 { page: Section1; }
body { font-family: 'Segoe UI', Calibri, Arial, sans-serif; font-size: 10pt; color: #2d2d2d; }
.vp-doc-header { text-align: center; margin: 0 0 14pt; }
.vp-doc-logo-box {
  display: inline-block;
  background: #ffffff;
  padding: 8pt 16pt;
  border-radius: 6pt;
  margin: 0 auto 10pt;
}
.vp-doc-logo { max-width: 220pt; max-height: 72pt; }
.vp-doc-rule { height: 3pt; background: ${purple}; margin: 0 auto 12pt; width: 100%; }
.vp-asunto { color: ${purple}; font-weight: bold; }
.vp-label { color: ${purple}; font-weight: bold; font-size: 9pt; text-transform: uppercase; }
.vp-valor { color: ${purple}; font-weight: bold; font-size: 11pt; }
.vp-servicio, .vp-obs { color: ${purple}; font-weight: bold; text-transform: uppercase; font-size: 9.5pt; }
.vp-footer { color: ${purple}; font-weight: bold; margin-top: 24pt; }
</style>
</head>
<body>
<div class="Section1">
  <div class="vp-doc-header">
    <div class="vp-doc-logo-box">
      <img class="vp-doc-logo" src="${logoSrc}" alt="Viajes Peludos">
    </div>
    <div class="vp-doc-rule"></div>
  </div>

  <p style="margin:0 0 10pt;">${escapeHtml(fechaCarta)}</p>
  ${destinatario}
  <p class="vp-asunto" style="margin:0 0 10pt;"><b>Asunto:</b> ${escapeHtml(doc.titulo)}</p>
  <p style="margin:0 0 8pt;font-weight:500;">Cordial saludo,</p>
  <p style="margin:0 0 10pt;text-align:justify;">${escapeHtml(doc.intro)}</p>

  <table cellpadding="4" cellspacing="0" width="100%" style="margin:8pt 0 12pt;border-left:3pt solid ${purple};">
    <tr>
      <td width="50%" valign="top">
        <span class="vp-label">${escapeHtml(doc.etiquetaRuta)}</span><br>
        <b>${escapeHtml(ruta)}</b>
      </td>
      <td width="50%" valign="top">
        <span class="vp-label">${escapeHtml(doc.etiquetaValor)}</span><br>
        <span class="vp-valor">${escapeHtml(valor)}</span>
      </td>
    </tr>
  </table>

  <p class="vp-servicio" style="margin:12pt 0 6pt;">${escapeHtml(doc.servicioTitulo)}</p>
  <p style="margin:0 0 10pt;text-align:justify;">${escapeHtml(doc.servicioDescripcion)}</p>
  <p class="vp-label" style="margin:0 0 6pt;">${escapeHtml(doc.etiquetaIncluye)}</p>
  <ul style="margin:0 0 10pt 18pt;padding:0;">${incluyeHtml}</ul>
  <p style="margin:0 0 12pt;text-align:justify;">${escapeHtml(doc.cierre)}</p>

  <p class="vp-obs" style="margin:12pt 0 6pt;">${escapeHtml(doc.etiquetaObservaciones)}</p>
  ${obsHtml}

  <p style="margin:24pt 0 8pt;">Atentamente,</p>
  <p class="vp-footer" style="margin:0;">${escapeHtml(fmt.empresa.nombre)}<br>
  <span style="font-weight:normal;color:#444;font-size:9pt;">NIT ${escapeHtml(fmt.empresa.nit)}</span></p>
</div>
</body>
</html>`;
}

function vpDocFilename(data) {
  const ruta = vpRutaTexto(data).replace(/\s+/g, '-').replace(/[^\w-]/g, '') || 'ruta';
  return `Cotizacion-Viajes-Peludos-${ruta}-${data.fecha || todayISO()}.doc`;
}

function vpDownloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 3000);
}

function vpExportDoc(data) {
  const html = vpBuildDocHtml(data);
  const blob = new Blob(['\ufeff', html], { type: 'application/msword;charset=utf-8' });
  const filename = vpDocFilename(data);

  if (window.AndroidApp?.saveDoc) {
    try {
      const reader = new FileReader();
      reader.onload = () => {
        const b64 = reader.result.split(',')[1];
        window.AndroidApp.saveDoc(b64, filename);
      };
      reader.readAsDataURL(blob);
      return;
    } catch (_) { /* fallback */ }
  }

  vpDownloadBlob(blob, filename);
}
