/**
 * Esquema de plantilla por defecto — editable desde la plataforma o importando JSON.
 */
const DEFAULT_TEMPLATE = {
  id: 'default-v1',
  nombre: 'Cotización corporativa',
  brand: {
    colorPrimario: '#c41e3a',
    colorSecundario: '#0a0a0a',
    colorTexto: '#1a1a1a',
    colorGris: '#646464',
    colorFondo: '#f7f7f7',
    barraSuperior: true,
    alturaBarraMm: 10
  },
  documento: {
    titulo: 'COTIZACIÓN',
    subtitulo: 'Propuesta comercial',
    etiquetaNumero: 'N° Cotización',
    etiquetaFecha: 'Fecha',
    etiquetaValidez: 'Válida hasta',
    etiquetaElaboro: 'Elaboró',
    formatoPapel: 'letter',
    orientacion: 'portrait',
    moneda: 'COP',
    prefijoMoneda: '$',
    locale: 'es-CO'
  },
  emisor: {
    etiquetaSeccion: 'EMPRESA EMISORA',
    campos: [
      { key: 'nombre', label: 'Nombre / Razón social', visible: true, enPdf: true },
      { key: 'nit', label: 'NIT / ID', visible: true, enPdf: true },
      { key: 'direccion', label: 'Dirección', visible: true, enPdf: true },
      { key: 'ciudad', label: 'Ciudad', visible: true, enPdf: true },
      { key: 'telefono', label: 'Teléfono', visible: true, enPdf: true },
      { key: 'email', label: 'E-mail', visible: true, enPdf: true },
      { key: 'web', label: 'Sitio web', visible: false, enPdf: true }
    ]
  },
  cliente: {
    etiquetaSeccion: 'CLIENTE',
    campos: [
      { key: 'empresa', label: 'Empresa', visible: true, enPdf: true },
      { key: 'contacto', label: 'Contacto', visible: true, enPdf: true },
      { key: 'nit', label: 'NIT / ID', visible: true, enPdf: true },
      { key: 'direccion', label: 'Dirección', visible: true, enPdf: true },
      { key: 'ciudad', label: 'Ciudad', visible: true, enPdf: true },
      { key: 'telefono', label: 'Teléfono', visible: true, enPdf: true },
      { key: 'email', label: 'E-mail', visible: true, enPdf: true }
    ]
  },
  tabla: {
    etiquetaSeccion: 'DETALLE DE LA COTIZACIÓN',
    columnas: [
      { key: 'num', label: '#', tipo: 'auto', anchoPct: 6, alinear: 'center' },
      { key: 'codigo', label: 'Código', tipo: 'text', anchoPct: 10, alinear: 'left' },
      { key: 'descripcion', label: 'Descripción', tipo: 'text', anchoPct: 34, alinear: 'left' },
      { key: 'unidad', label: 'Und', tipo: 'text', anchoPct: 8, alinear: 'center' },
      { key: 'cantidad', label: 'Cant.', tipo: 'number', anchoPct: 10, alinear: 'right' },
      { key: 'precioUnit', label: 'P. unitario', tipo: 'money', anchoPct: 14, alinear: 'right' },
      { key: 'descuentoPct', label: 'Desc %', tipo: 'percent', anchoPct: 8, alinear: 'right' },
      { key: 'subtotal', label: 'Subtotal', tipo: 'moneyCalc', anchoPct: 10, alinear: 'right' }
    ],
    mostrarTotales: true,
    etiquetaSubtotal: 'Subtotal',
    etiquetaDescuento: 'Descuento global',
    etiquetaImpuesto: 'IVA / Impuesto',
    etiquetaTotal: 'TOTAL',
    impuestoPct: 0,
    descuentoGlobalPct: 0
  },
  bloques: {
    introduccion: {
      visible: true,
      titulo: 'Referencia',
      texto: 'A continuación presentamos nuestra propuesta comercial según los requerimientos indicados.'
    },
    condiciones: {
      visible: true,
      titulo: 'Términos y condiciones',
      texto: '• Precios en pesos colombianos (COP) salvo indicación contraria.\n• Validez de la oferta según fecha indicada.\n• Forma de pago: 50% anticipo, 50% contra entrega.\n• Tiempos de entrega sujetos a disponibilidad.'
    },
    notas: {
      visible: true,
      titulo: 'Notas adicionales',
      texto: ''
    },
    firma: {
      visible: true,
      etiquetaEmisor: 'Aprobado por',
      etiquetaCliente: 'Aceptado por',
      mostrarLinea: true
    },
    piePagina: {
      visible: true,
      texto: 'Documento generado electrónicamente — válido sin firma autógrafa según acuerdo comercial.'
    }
  },
  logo: null
};

const DEFAULT_QUOTE = {
  meta: {
    numero: '',
    fecha: '',
    validaHasta: '',
    elaboro: ''
  },
  emisor: {
    nombre: '',
    nit: '',
    direccion: '',
    ciudad: '',
    telefono: '',
    email: '',
    web: ''
  },
  cliente: {
    empresa: '',
    contacto: '',
    nit: '',
    direccion: '',
    ciudad: '',
    telefono: '',
    email: ''
  },
  lineas: [
    { codigo: '', descripcion: '', unidad: 'und', cantidad: 1, precioUnit: 0, descuentoPct: 0 }
  ],
  totales: {
    descuentoGlobalPct: 0,
    impuestoPct: 0,
    notasPie: ''
  },
  bloques: {
    introduccion: '',
    condiciones: '',
    notas: ''
  }
};

function cloneDefaultTemplate() {
  return JSON.parse(JSON.stringify(DEFAULT_TEMPLATE));
}

function cloneDefaultQuote() {
  return JSON.parse(JSON.stringify(DEFAULT_QUOTE));
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function addDaysISO(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}
