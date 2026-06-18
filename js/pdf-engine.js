function buildPdfFromTemplate(template, quote, logo) {
  const { jsPDF } = window.jspdf;
  const doc = template.documento || {};
  const brand = template.brand || {};
  const margin = 18;
  const format = doc.formatoPapel || 'letter';
  const pdf = new jsPDF({ orientation: doc.orientacion || 'portrait', unit: 'mm', format });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const primary = hexToRgb(brand.colorPrimario || '#c41e3a');
  const secondary = hexToRgb(brand.colorSecundario || '#0a0a0a');
  const gray = hexToRgb(brand.colorGris || '#646464');
  let y = margin;

  if (brand.barraSuperior) {
    const h = brand.alturaBarraMm || 10;
    pdf.setFillColor(...secondary);
    pdf.rect(0, 0, pageWidth, h * 0.8, 'F');
    pdf.setFillColor(...primary);
    pdf.rect(0, h * 0.8, pageWidth, h * 0.2, 'F');
    y = h + 8;
  }

  if (logo) {
    try {
      pdf.addImage(logo, 'PNG', margin, y, 24, 24);
    } catch {
      try { pdf.addImage(logo, 'JPEG', margin, y, 24, 24); } catch { /* skip */ }
    }
  }

  const headerX = margin + (logo ? 28 : 0);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(14);
  pdf.setTextColor(...secondary);
  pdf.text(quote.emisor?.nombre || doc.titulo || 'COTIZACIÓN', headerX, y + 5);
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(...gray);
  if (doc.subtitulo) pdf.text(doc.subtitulo, headerX, y + 10);
  if (quote.emisor?.direccion) pdf.text(quote.emisor.direccion, headerX, y + 15);
  const contact = [quote.emisor?.telefono, quote.emisor?.email].filter(Boolean).join(' · ');
  if (contact) pdf.text(contact, headerX, y + 20);
  y += 30;

  pdf.setDrawColor(...primary);
  pdf.setLineWidth(0.5);
  pdf.line(margin, y, pageWidth - margin, y);
  y += 8;

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  pdf.setTextColor(...secondary);
  pdf.text('DATOS DEL DOCUMENTO', margin, y);
  y += 6;
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  const metaPairs = [
    [doc.etiquetaNumero, quote.meta?.numero || '—'],
    [doc.etiquetaFecha, formatDate(quote.meta?.fecha)],
    [doc.etiquetaValidez, formatDate(quote.meta?.validaHasta)],
    [doc.etiquetaElaboro, quote.meta?.elaboro || '—']
  ];
  metaPairs.forEach(([label, val], i) => {
    const col = i % 2 === 0 ? margin : 108;
    if (i % 2 === 0 && i > 0) y += 5;
    pdf.setFont('helvetica', 'bold');
    pdf.text(`${label}:`, col, y);
    pdf.setFont('helvetica', 'normal');
    pdf.text(String(val), col + 32, y);
    if (i % 2 === 1) y += 5;
  });
  y += 10;

  const boxW = (pageWidth - margin * 2 - 6) / 2;
  drawPartyBox(pdf, margin, y, boxW, template.emisor, quote.emisor, secondary, primary, gray);
  drawPartyBox(pdf, margin + boxW + 6, y, boxW, template.cliente, quote.cliente, secondary, primary, gray);
  y += 38;

  const intro = getBlockText(quote, template, 'introduccion');
  if (template.bloques?.introduccion?.visible && intro) {
    y = writeBlock(pdf, margin, y, pageWidth, template.bloques.introduccion.titulo, intro, secondary, gray);
  }

  const computed = computeTotals(quote, template);
  const cols = template.tabla?.columnas || [];
  const head = cols.map(c => c.label);
  const body = computed.lineas.map(line => cols.map(col => {
    if (col.key === 'num') return String(line.num);
    if (col.key === 'subtotal' || col.tipo === 'moneyCalc') return formatMoney(line.subtotal, template);
    if (col.tipo === 'money') return formatMoney(Number(line[col.key]) || 0, template);
    if (col.tipo === 'percent') return `${Number(line[col.key]) || 0}%`;
    return String(line[col.key] ?? '');
  }));

  y = ensureSpace(pdf, y, 40, margin, pageHeight);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  pdf.setTextColor(...secondary);
  pdf.text(template.tabla?.etiquetaSeccion || 'DETALLE', margin, y);
  y += 4;

  pdf.autoTable({
    startY: y,
    head: [head],
    body,
    margin: { left: margin, right: margin },
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: secondary, textColor: [255, 255, 255], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: hexToRgb(brand.colorFondo || '#f7f7f7') },
    columnStyles: cols.reduce((acc, c, i) => {
      acc[i] = { halign: c.alinear === 'right' ? 'right' : c.alinear === 'center' ? 'center' : 'left' };
      return acc;
    }, {})
  });
  y = pdf.lastAutoTable.finalY + 6;

  if (template.tabla?.mostrarTotales) {
    const totalsX = pageWidth - margin - 55;
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(...gray);
    pdf.text(template.tabla.etiquetaSubtotal, totalsX, y);
    pdf.text(formatMoney(computed.subtotal, template), pageWidth - margin, y, { align: 'right' });
    y += 5;
    if (computed.descPct) {
      pdf.text(`${template.tabla.etiquetaDescuento} (${computed.descPct}%)`, totalsX, y);
      pdf.text(`-${formatMoney(computed.descuento, template)}`, pageWidth - margin, y, { align: 'right' });
      y += 5;
    }
    if (computed.taxPct) {
      pdf.text(`${template.tabla.etiquetaImpuesto} (${computed.taxPct}%)`, totalsX, y);
      pdf.text(formatMoney(computed.impuesto, template), pageWidth - margin, y, { align: 'right' });
      y += 5;
    }
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11);
    pdf.setTextColor(...primary);
    pdf.text(template.tabla.etiquetaTotal, totalsX, y + 2);
    pdf.text(formatMoney(computed.total, template), pageWidth - margin, y + 2, { align: 'right' });
    y += 14;
  }

  const cond = getBlockText(quote, template, 'condiciones');
  if (template.bloques?.condiciones?.visible && cond) {
    y = writeBlock(pdf, margin, y, pageWidth, template.bloques.condiciones.titulo, cond, secondary, gray);
  }
  const notas = getBlockText(quote, template, 'notas') || quote.totales?.notasPie;
  if (template.bloques?.notas?.visible && notas) {
    y = writeBlock(pdf, margin, y, pageWidth, template.bloques.notas.titulo, notas, secondary, gray);
  }

  if (template.bloques?.firma?.visible) {
    y = ensureSpace(pdf, y, 25, margin, pageHeight);
    const mid = pageWidth / 2;
    pdf.setDrawColor(...gray);
    pdf.line(margin, y + 12, margin + 55, y + 12);
    pdf.line(mid + 10, y + 12, mid + 65, y + 12);
    pdf.setFontSize(8);
    pdf.setTextColor(...gray);
    pdf.text(template.bloques.firma.etiquetaEmisor, margin, y + 17);
    pdf.text(template.bloques.firma.etiquetaCliente, mid + 10, y + 17);
    y += 22;
  }

  if (template.bloques?.piePagina?.visible && template.bloques.piePagina.texto) {
    pdf.setFontSize(7);
    pdf.setTextColor(...gray);
    pdf.text(template.bloques.piePagina.texto, pageWidth / 2, pageHeight - 10, { align: 'center' });
  }

  return pdf;
}

function drawPartyBox(pdf, x, y, w, section, data, secondary, primary, gray) {
  pdf.setDrawColor(...primary);
  pdf.setLineWidth(0.3);
  pdf.roundedRect(x, y, w, 32, 2, 2, 'S');
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8);
  pdf.setTextColor(...primary);
  pdf.text(section?.etiquetaSeccion || '', x + 3, y + 5);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7.5);
  pdf.setTextColor(...secondary);
  let yy = y + 10;
  (section?.campos || []).filter(f => f.enPdf).forEach(f => {
    const v = data?.[f.key];
    if (!v) return;
    const line = `${f.label}: ${v}`;
    const wrapped = pdf.splitTextToSize(line, w - 6);
    pdf.text(wrapped, x + 3, yy);
    yy += wrapped.length * 3.5;
  });
}

function writeBlock(pdf, margin, y, pageWidth, title, text, secondary, gray) {
  y = ensureSpace(pdf, y, 20, margin, pdf.internal.pageSize.getHeight());
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9);
  pdf.setTextColor(...secondary);
  pdf.text(title, margin, y);
  y += 5;
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(...gray);
  const lines = pdf.splitTextToSize(text, pageWidth - margin * 2);
  pdf.text(lines, margin, y);
  return y + lines.length * 3.8 + 6;
}

function ensureSpace(pdf, y, need, margin, pageHeight) {
  if (y + need > pageHeight - margin) {
    pdf.addPage();
    return margin;
  }
  return y;
}

function exportPdf(template, quote, logo) {
  const pdf = buildPdfFromTemplate(template, quote, logo);
  const filename = `cotizacion-${quote.meta?.numero || 'nueva'}-${quote.meta?.fecha || todayISO()}.pdf`;

  if (window.AndroidApp && typeof window.AndroidApp.savePdf === 'function') {
    try {
      const raw = pdf.output('arraybuffer');
      const bytes = new Uint8Array(raw);
      let binary = '';
      const chunk = 0x8000;
      for (let i = 0; i < bytes.length; i += chunk) {
        binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
      }
      window.AndroidApp.savePdf(btoa(binary), filename);
      return;
    } catch (err) {
      console.warn('Bridge Android falló', err);
    }
  }
  pdf.save(filename);
}
