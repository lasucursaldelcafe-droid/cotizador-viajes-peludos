/**
 * Logo Viajes Peludos — PNG embebido o local, sin servidor.
 */
const VP_LOGO_PNG = 'assets/logo-viajes-peludos.png';

let VP_LOGO_DATA_URL = null;
let VP_LOGO_WATERMARK_URL = null;

function vpLogoSource() {
  if (typeof VP_EMBEDDED_ASSETS !== 'undefined' && VP_EMBEDDED_ASSETS.logo) {
    return VP_EMBEDDED_ASSETS.logo;
  }
  return VP_LOGO_PNG;
}

function vpLoadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('No se pudo cargar: ' + src));
    img.src = src;
  });
}

function vpMakeWatermark(canvas, opacity) {
  const wm = document.createElement('canvas');
  wm.width = canvas.width;
  wm.height = canvas.height;
  const ctx = wm.getContext('2d');
  ctx.globalAlpha = opacity;
  ctx.drawImage(canvas, 0, 0);
  return wm.toDataURL('image/png');
}

async function vpLoadLogo(fmt) {
  if (VP_LOGO_DATA_URL && VP_LOGO_WATERMARK_URL) {
    return { logo: VP_LOGO_DATA_URL, watermark: VP_LOGO_WATERMARK_URL };
  }

  const logoPath = fmt?.assets?.logo || vpLogoSource();
  const img = await vpLoadImage(logoPath);
  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  canvas.getContext('2d').drawImage(img, 0, 0);

  VP_LOGO_DATA_URL = canvas.toDataURL('image/png');
  VP_LOGO_WATERMARK_URL = vpMakeWatermark(canvas, 0.09);
  return { logo: VP_LOGO_DATA_URL, watermark: VP_LOGO_WATERMARK_URL };
}

function vpGetLogoSrc(fmt) {
  return fmt?.assets?.logo || vpLogoSource();
}

function vpGetFondoSrc(fmt) {
  if (fmt?.assets?.fondo) return fmt.assets.fondo;
  if (typeof VP_EMBEDDED_ASSETS !== 'undefined' && VP_EMBEDDED_ASSETS.fondo) {
    return VP_EMBEDDED_ASSETS.fondo;
  }
  return 'assets/image2.png';
}

function vpGetWatermarkSrc() {
  return VP_LOGO_WATERMARK_URL || vpLogoSource();
}

function vpDetectImageFormat(dataUrl) {
  if (!dataUrl || typeof dataUrl !== 'string') return 'PNG';
  if (dataUrl.includes('image/jpeg')) return 'JPEG';
  return 'PNG';
}

async function vpLoadLogoFromPdf() {
  return vpLoadLogo({ assets: { logo: vpLogoSource() } });
}
