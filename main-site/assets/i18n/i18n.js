// assets/i18n/i18n.js
// The runtime from i18n-retrofit-spec.md section 15, as written.
let locales = {};
let registry = [];
let active = 'en';
let fallback = 'en';
let storageKey = 'locale';
let debug = false;
const listeners = new Set();

function warn(...args) { if (debug) console.warn('[i18n]', ...args); }

function readStored() {
  try { return localStorage.getItem(storageKey); } catch { return null; }
}
function writeStored(code) {
  try { localStorage.setItem(storageKey, code); } catch { /* not remembered */ }
}

function known(code) {
  return registry.find(l => l.code.toLowerCase() === String(code).toLowerCase());
}

// A tag's script, filled in by Intl where the tag leaves it out (zh-TW is
// Traditional Chinese, Hant; zh-SG Simplified, Hans), and its region only if
// the tag names one: Intl would make a bare "en" en-US, and a device that
// just says English should get the site's first English, en-GB.
function subtags(tag) {
  try {
    const loc = new Intl.Locale(tag);
    return { script: loc.maximize().script || '', region: loc.region || '' };
  } catch {
    return { script: '', region: '' };
  }
}

// The site language closest to a device tag among those sharing its base
// language: same script first, then same region, then registry order. So with
// zh-SG and zh-HK on the site, zh-TW gets zh-HK (both Traditional); with only
// zh-SG, it gets zh-SG. en-US gets en-GB.
function closest(tag, lang, list) {
  const siblings = list.filter(l => l.code.split('-')[0].toLowerCase() === lang);
  if (siblings.length <= 1) return siblings[0];
  const want = subtags(tag);
  const score = (l) => {
    const have = subtags(l.code);
    return (want.script && have.script === want.script ? 2 : 0)
      + (want.region && have.region === want.region ? 1 : 0);
  };
  return siblings.reduce((best, l) => (score(l) > score(best) ? l : best));
}

function deviceTags() {
  const tags = navigator.languages && navigator.languages.length
    ? navigator.languages
    : [navigator.language];
  return tags.filter(Boolean);
}

// The device's languages, in its order of preference, each tried against
// `list` as: the exact code (pt-BR), its base language (pt), then the closest
// entry sharing that base (pt-PT finds pt-BR). The last step goes beyond
// section 5 of the spec: without it, a device set to en-US then fr would skip
// the site's en-GB and land on French.
function matchDevice(list) {
  const find = (code) => list.find(l => l.code.toLowerCase() === String(code).toLowerCase());
  for (const tag of deviceTags()) {
    const exact = find(tag);
    if (exact) return exact;
    const lang = tag.split('-')[0].toLowerCase();
    const base = find(lang);
    if (base) return base;
    const sibling = closest(tag, lang, list);
    if (sibling) return sibling;
  }
  return undefined;
}

// A stored choice wins, then the device's languages, then the default.
function detect() {
  const stored = readStored();
  if (stored && known(stored)) return known(stored).code;
  const match = matchDevice(registry);
  return match ? match.code : fallback;
}

// Of the given codes, the one the device's languages come closest to, or
// undefined. The switcher uses it to pick which variant of a language a row
// stands for before the reader opens its dropdown.
export function deviceChoice(codes) {
  const list = registry.filter(l => codes.includes(l.code));
  const match = matchDevice(list);
  return match ? match.code : undefined;
}

function interpolate(str, params) {
  return str.replace(/\{(\w+)\}/g, (m, name) => {
    if (params && name in params) return String(params[name]);
    warn('unmatched placeholder', name, 'in', str);
    return m;
  });
}

function lookup(key, code) {
  const table = locales[code];
  return table && Object.prototype.hasOwnProperty.call(table, key) ? table[key] : undefined;
}

export function t(key, params) {
  let k = key;
  if (params && typeof params.count === 'number') {
    const cat = new Intl.PluralRules(active).select(params.count);
    if (lookup(`${key}.${cat}`, active) !== undefined) k = `${key}.${cat}`;
    else if (lookup(`${key}.other`, active) !== undefined) k = `${key}.other`;
  }
  let str = lookup(k, active);
  if (str === undefined) {
    warn('missing key', k, 'in', active);
    str = lookup(k, fallback);
  }
  if (str === undefined) {
    warn('missing key', k, 'in fallback', fallback);
    return key;
  }
  return interpolate(str, params);
}

export function applyTo(root = document) {
  const params = el => {
    const raw = el.getAttribute('data-i18n-params');
    if (!raw) return undefined;
    try { return JSON.parse(raw); } catch { warn('bad data-i18n-params on', el); return undefined; }
  };
  root.querySelectorAll('[data-i18n]').forEach(el => {
    el.textContent = t(el.getAttribute('data-i18n'), params(el));
  });
  root.querySelectorAll('[data-i18n-attr]').forEach(el => {
    el.getAttribute('data-i18n-attr').split(',').forEach(pair => {
      const [attr, key] = pair.split(':').map(s => s.trim());
      if (attr && key) el.setAttribute(attr, t(key, params(el)));
    });
  });
}

function applyDocument() {
  const entry = known(active);
  document.documentElement.lang = active;
  document.documentElement.dir = entry && entry.dir ? entry.dir : 'ltr';
  applyTo(document);
}

export function setLocale(code) {
  const entry = known(code);
  if (!entry || entry.code === active) return;
  active = entry.code;
  writeStored(active);
  applyDocument();
  listeners.forEach(fn => fn(active));
}

export function getLocale() { return active; }
export function getLocales() { return registry.slice(); }
export function onChange(fn) { listeners.add(fn); return () => listeners.delete(fn); }

export function init(opts) {
  locales = opts.locales;
  registry = opts.registry;
  fallback = opts.defaultLocale || 'en';
  storageKey = opts.storageKey || 'locale';
  debug = opts.debug ?? ['localhost', '127.0.0.1'].includes(location.hostname);
  active = detect();
  applyDocument();
  return active;
}
