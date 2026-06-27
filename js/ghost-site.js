/**
 * Ghost Specialty Coffee — interacciones, contenido dinámico y chrome
 */
(function (global) {
  'use strict';

  var cfg = global.GHOST_SITE || {};
  var content = null;

  function $(sel, ctx) {
    return (ctx || document).querySelector(sel);
  }

  function $$(sel, ctx) {
    return Array.prototype.slice.call((ctx || document).querySelectorAll(sel));
  }

  function loadContent() {
    if (content) return Promise.resolve(content);
    var url = cfg.asset ? cfg.asset('content/site.json') : 'content/site.json';
    return fetch(url)
      .then(function (r) {
        if (!r.ok) throw new Error('No se pudo cargar site.json');
        return r.json();
      })
      .then(function (data) {
        content = data;
        return data;
      })
      .catch(function () {
        content = {};
        return content;
      });
  }

  function initNav() {
    var toggle = $('#ghostNavToggle');
    var menu = $('#ghostNavMenu');
    if (!toggle || !menu) return;

    toggle.addEventListener('click', function () {
      var open = menu.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });

    $$('.ghost-nav__menu a', menu).forEach(function (link) {
      link.addEventListener('click', function () {
        menu.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  function initReveal() {
    if (!('IntersectionObserver' in global)) {
      $$('.reveal').forEach(function (el) { el.classList.add('is-visible'); });
      return;
    }
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    $$('.reveal').forEach(function (el) { obs.observe(el); });
  }

  function buildMarquee(items) {
    var track = $('#ghostMarqueeTrack');
    if (!track || !items || !items.length) return;
    var text = items.concat(items).map(function (item) {
      return '<span>' + escapeHtml(item) + '</span>';
    }).join('');
    track.innerHTML = text;
  }

  function buildExperiences(experiences) {
    var container = $('#ghostExperiences');
    if (!container || !experiences) return;
    container.innerHTML = experiences.map(function (exp, i) {
      return (
        '<article class="ghost-experience__card reveal">' +
          '<div class="ghost-experience__num">' + String(i + 1).padStart(2, '0') + '</div>' +
          '<h3 class="ghost-experience__title">' + escapeHtml(exp.title) + '</h3>' +
          '<p class="ghost-experience__sub">' + escapeHtml(exp.subtitle) + '</p>' +
          '<p class="ghost-experience__text">' + escapeHtml(exp.description) + '</p>' +
        '</article>'
      );
    }).join('');
  }

  function buildProducts(products) {
    var container = $('#ghostProducts');
    if (!container || !products) return;
    var imgPath = cfg.asset ? cfg.asset('assets/images/products/caja-cafe.png') : 'assets/images/products/caja-cafe.png';
    container.innerHTML = products.map(function (p) {
      var notes = (p.notes || []).map(function (n) {
        return '<span class="ghost-product__tag">' + escapeHtml(n) + '</span>';
      }).join('');
      var featured = p.featured ? ' ghost-product--featured' : '';
      return (
        '<article class="ghost-product reveal' + featured + '">' +
          '<img class="ghost-product__img" src="' + imgPath + '" alt="' + escapeHtml(p.name) + '" loading="lazy" width="200" height="180">' +
          '<h3 class="ghost-product__name">' + escapeHtml(p.name) + '</h3>' +
          '<p class="ghost-product__meta">' + escapeHtml(p.origin || '') + ' · ' + escapeHtml(p.roast || '') + '</p>' +
          '<div class="ghost-product__notes">' + notes + '</div>' +
          '<p class="ghost-product__price">' + cfg.formatCop(p.price) + ' <small>/ ' + escapeHtml(p.weight || '') + '</small></p>' +
        '</article>'
      );
    }).join('');
  }

  function buildValues(values) {
    var container = $('#ghostValues');
    if (!container || !values) return;
    container.innerHTML = values.map(function (v) {
      return (
        '<div class="ghost-value reveal">' +
          '<h3 class="ghost-value__title">' + escapeHtml(v.title) + '</h3>' +
          '<p class="ghost-value__text">' + escapeHtml(v.text) + '</p>' +
        '</div>'
      );
    }).join('');
  }

  function buildMenu(menu) {
    var container = $('#ghostMenu');
    if (!container || !menu) return;
    container.innerHTML = menu.map(function (group) {
      var items = (group.items || []).map(function (item) {
        var desc = item.description
          ? '<p class="ghost-menu-item__desc">' + escapeHtml(item.description) + '</p>'
          : '';
        return (
          '<div class="ghost-menu-item">' +
            '<div>' +
              '<p class="ghost-menu-item__name">' + escapeHtml(item.name) + '</p>' +
              desc +
            '</div>' +
            '<span class="ghost-menu-item__price">' + cfg.formatCop(item.price) + '</span>' +
          '</div>'
        );
      }).join('');
      return (
        '<div class="ghost-menu-group reveal">' +
          '<h2 class="ghost-menu-group__title">' + escapeHtml(group.name) + '</h2>' +
          items +
        '</div>'
      );
    }).join('');
  }

  function applyBrand(brand) {
    if (!brand) return;

    function setText(id, text) {
      var el = document.getElementById(id);
      if (el && text) el.textContent = text;
    }

    setText('ghostTagline', brand.tagline);
    setText('ghostHeadline', brand.headline);
    setText('ghostSubheadline', brand.subheadline);
    setText('ghostDescriptor', brand.descriptor);
    setText('ghostStory', brand.story);
    setText('ghostAbout', brand.about);
    setText('ghostMission', brand.mission);
    setText('ghostVision', brand.vision);
    setText('ghostHours', brand.hours);
    setText('ghostAddress', brand.address);
    setText('ghostCity', brand.city);
    setText('ghostFooterLine', brand.footerLine);

    var wa = $('#ghostWhatsapp');
    if (wa && brand.whatsapp) {
      wa.href = cfg.whatsappUrl(brand.whatsapp, 'Hola Ghost, quiero información sobre su café de especialidad.');
    }

    var ig = $('#ghostInstagram');
    if (ig && brand.social && brand.social.instagram) {
      ig.href = brand.social.instagram;
    }

    if (brand.email) {
      var email = $('#ghostEmail');
      if (email) {
        email.href = 'mailto:' + brand.email;
        email.textContent = brand.email;
      }
    }
  }

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function init() {
    initNav();
    initReveal();

    loadContent().then(function (data) {
      applyBrand(data.brand);
      buildMarquee(data.marquee);
      buildExperiences(data.experiences);
      buildProducts(data.products);
      buildValues(data.brand && data.brand.values);
      buildMenu(data.menu);
      initReveal();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})(typeof window !== 'undefined' ? window : this);
