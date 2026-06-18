/**
 * Plantilla oficial — Cotización Viajes Peludos 2026
 * Basada en: Cotizacion Viajes Peludos 2026.docx
 */
const VP_BRAND = {
  purple: '#8B2D9E',
  yellow: '#F5C518',
  text: '#2d2d2d',
  muted: '#555555'
};

const VP_DEFAULTS = {
  empresa: {
    nombre: 'VIAJES PELUDOS S.A.S',
    nit: '900.780.560-3'
  },
  documento: {
    titulo: 'PRESUPUESTO TRANSPORTE INTERNACIONAL DE MASCOTAS',
    intro: 'Atendiendo cordialmente su solicitud, presentamos nuestra cotización para el acompañamiento integral PET NANNY en el traslado internacional de su mascota.',
    servicioTitulo: 'SERVICIO PET NANNY - TODO INCLUIDO',
    servicioDescripcion: 'El servicio de PET NANNY consiste en un acompañamiento personalizado en el que un niñero especializado se encarga de todo el proceso de viaje de la mascota, garantizando seguridad, bienestar y cumplimiento legal',
    cierre: 'Esta cotización cubre el proceso completo de viaje de la mascota, de aeropuerto a aeropuerto, sin que el propietario deba encargarse de trámites, permisos o gestiones adicionales.',
    etiquetaRuta: 'RUTA:',
    etiquetaValor: 'VALOR:',
    etiquetaIncluye: 'Incluye',
    etiquetaObservaciones: 'OBSERVACIONES'
  },
  incluye: [
    'Acompañamiento integral de PET NANNY durante todo el trayecto',
    'Gestión completa de documentos, permisos y requisitos sanitarios',
    'Coordinación y gestión de vuelos internacionales',
    'Transporte aéreo internacional',
    'Acompañamiento en inspecciones de aerolínea, aduana y autoridades',
    'Entrega segura de la mascota en el aeropuerto de destino'
  ],
  observaciones: [
    'El pago de la cotización se puede realizar en USD en nuestra cuenta Chase Bank en caso de que el pago sea en otra moneda el valor será liquidado a la tasa de cambio vigente el día del pago.',
    'El transporte está sujeto a disponibilidad de cupo y condiciones operativas de la aerolínea.'
  ],
  assets: {
    logo: 'assets/logo-viajes-peludos.png',
    fondo: 'assets/image2.png'
  }
};

function vpIsFileMode() {
  return location.protocol === 'file:';
}

function vpApplyEmbeddedAssets() {
  if (typeof VP_EMBEDDED_ASSETS === 'undefined') return;
  VP_DEFAULTS.assets.logo = VP_EMBEDDED_ASSETS.logo;
  VP_DEFAULTS.assets.fondo = VP_EMBEDDED_ASSETS.fondo;
}

const VP_STORAGE_KEY = 'viajes-peludos-cotiz-v3';

function vpCloneDefaults() {
  return JSON.parse(JSON.stringify({
    fecha: todayISO(),
    ciudadCarta: 'Medellín',
    cliente: '',
    mascota: '',
    origen: 'MEDELLÍN',
    destino: 'BOSTON',
    moneda: 'USD',
    valor: 2600,
    incluye: [...VP_DEFAULTS.incluye],
    observaciones: [...VP_DEFAULTS.observaciones],
    formato: JSON.parse(JSON.stringify(VP_DEFAULTS))
  }));
}

function vpFormatFechaLarga(iso) {
  if (!iso) return '';
  const d = new Date(iso + 'T12:00:00');
  const meses = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
  return `${d.getDate()} de ${meses[d.getMonth()]} de ${d.getFullYear()}`;
}

function vpFormatFechaCarta(ciudad, iso) {
  const c = (ciudad || 'Medellín').trim();
  const f = vpFormatFechaLarga(iso);
  return f ? `${c}, ${f}` : c;
}

function vpFormatValor(moneda, valor) {
  const n = Number(valor);
  if (!Number.isFinite(n)) return `${moneda} 0`;
  const formatted = n.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  return `${moneda} ${formatted}`;
}

function vpRutaTexto(data) {
  const o = (data.origen || '').trim();
  const d = (data.destino || '').trim();
  if (o && d) return `${o} - ${d}`;
  return o || d || '';
}

function vpLoad() {
  try {
    const raw = localStorage.getItem(VP_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function vpSave(data) {
  data.savedAt = new Date().toISOString();
  localStorage.setItem(VP_STORAGE_KEY, JSON.stringify(data));
  return data.savedAt;
}
