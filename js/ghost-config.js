/**
 * Ghost Specialty Coffee — configuración y utilidades del sitio
 */
(function (global) {
  'use strict';

  var SITE = {
    name: 'Ghost Specialty Coffee',
    basePath: detectBasePath(),
    pages: {
      home: 'index.html',
      menu: 'menu.html',
      origen: 'origen.html',
      nosotros: 'nosotros.html',
      contacto: 'contacto.html'
    }
  };

  function detectBasePath() {
    var path = global.location.pathname || '';
    if (path.indexOf('/ghost_coffee_shop') !== -1) {
      return '/ghost_coffee_shop';
    }
    return '';
  }

  function asset(path) {
    return SITE.basePath + '/' + String(path).replace(/^\//, '');
  }

  function pageUrl(key) {
    return asset(SITE.pages[key] || key);
  }

  function whatsappUrl(phone, text) {
    var num = String(phone || '').replace(/\D/g, '');
    var msg = encodeURIComponent(text || 'Hola Ghost, quiero saber más sobre su café.');
    if (!num) return '#';
    return 'https://wa.me/' + num + '?text=' + msg;
  }

  function formatCop(value) {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0
    }).format(value);
  }

  global.GHOST_SITE = {
    SITE: SITE,
    asset: asset,
    pageUrl: pageUrl,
    whatsappUrl: whatsappUrl,
    formatCop: formatCop
  };
})(typeof window !== 'undefined' ? window : this);
