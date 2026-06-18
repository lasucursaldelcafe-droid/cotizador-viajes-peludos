const STORAGE_KEY = 'cotizador-web-v1';

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function saveState(template, quote, logo) {
  const payload = {
    template,
    quote,
    logo,
    savedAt: new Date().toISOString()
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  return payload.savedAt;
}

function exportTemplateJson(template, logo) {
  return JSON.stringify({ template, logo, exportedAt: new Date().toISOString() }, null, 2);
}

function importTemplateJson(text) {
  const data = JSON.parse(text);
  if (!data.template) throw new Error('El JSON no contiene "template"');
  return { template: data.template, logo: data.logo || null };
}

function exportQuoteJson(template, quote, logo) {
  return JSON.stringify({ template, quote, logo, exportedAt: new Date().toISOString() }, null, 2);
}

function importQuoteJson(text) {
  const data = JSON.parse(text);
  if (!data.quote) throw new Error('El JSON no contiene "quote"');
  return {
    template: data.template || null,
    quote: data.quote,
    logo: data.logo || null
  };
}
