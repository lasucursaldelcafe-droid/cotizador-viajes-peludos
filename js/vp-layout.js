/**
 * Márgenes calibrados al membrete (curvas morado/amarillo).
 * Carta US: 8.5 × 11 in = 215.9 × 279.4 mm
 */
const VP_LAYOUT = {
  inch: {
    pageW: 8.5,
    pageH: 11,
    marginX: 1.0,
    headerTop: 0.48,
    logoMaxW: 2.35,
    logoMaxH: 0.82,
    marginBottom: 1.38
  },
  mm: {
    pageW: 215.9,
    pageH: 279.4,
    marginX: 25.4,
    logoX: 25.4,
    logoY: 12,
    logoW: 52,
    logoH: 18,
    ruleY: 33,
    bodyY: 46,
    marginBottom: 35,
    footerBlockY: 248,
    lineH: 4.2
  },
  watermark: {
    xPct: 0.5,
    yPct: 0.52,
    wPct: 0.58,
    hPct: 0.18
  }
};

function vpApplyLayoutVars() {
  const L = VP_LAYOUT.inch;
  const r = document.documentElement;
  r.style.setProperty('--letter-w', `${L.pageW}in`);
  r.style.setProperty('--letter-h', `${L.pageH}in`);
  r.style.setProperty('--margin-x', `${L.marginX}in`);
  r.style.setProperty('--header-top', `${L.headerTop}in`);
  r.style.setProperty('--margin-bottom', `${L.marginBottom}in`);
  r.style.setProperty('--logo-max-w', `${L.logoMaxW}in`);
  r.style.setProperty('--logo-max-h', `${L.logoMaxH}in`);
}
