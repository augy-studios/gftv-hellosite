// assets/i18n/switcher.js
// The language button (section 7) and modal (section 8) of
// i18n-retrofit-spec.md. The modal uses the site's shared dialog behaviour
// from js/ui.js: focus trap, inert background, scroll lock, Escape and
// backdrop to close.
//
// Three departures from section 8, all asked for:
// - Rows are in alphabetical order of the name they show, not registry order
//   (see sortFamilies).
// - A search box above the list (name or code).
// - Languages with regional variants (en-GB and en-US, zh-SG and zh-TW) share
//   one row, with a dropdown button at its far end listing the variants. A
//   listbox option cannot hold a button, so rows are plain buttons in a list,
//   with aria-current on the active language; the arrow keys still move
//   between rows as section 8.2 describes.
import { t, getLocale, getLocales, setLocale, onChange, deviceChoice } from './i18n.js';
import { icon } from '../../js/icons.js';
import { openModal, closeModal } from '../../js/ui.js';

const MODAL_ID = 'langModal';
let button = null;
let search = null;
let list = null;

// One per base language, in alphabetical order (index is the position):
// { lang, name, index, multi, item, head, toggle, variants: [{ entry, button }] }
let families = [];
// Families whose dropdown the reader opened. Cleared each time the modal opens.
const opened = new Set();

function current() {
  return getLocales().find((l) => l.code === getLocale()) || getLocales()[0];
}

function renderButton() {
  if (!button) return;
  const entry = current();
  button.innerHTML =
    `${icon('globe')}<span class="lang-name"></span><span class="lang-code"></span>`;
  // The visible name is the language's own name, never translated.
  button.querySelector('.lang-name').textContent = entry.name;
  // On a phone the button shows the code instead; `abbr` shortens a long one
  // (EN-SINGLISH shows EN-SG) so the site name beside it still fits.
  button.querySelector('.lang-code').textContent = (entry.abbr || entry.code).toUpperCase();
  button.setAttribute('aria-label', t('a11y.language-switcher', { language: entry.name }));
}

// Variant names: the region in brackets at the end of a registry name,
// "English (UK)" or "中文（新加坡）".
const BRACKETS = /\s*[(（]([^()（）]+)[)）]\s*$/;

// The family's own name: the registry names with their brackets removed when
// they agree ("English"); else the name of a variant without brackets, which
// is the language in its usual script ("日本語" beside "Nihongo (Romanised)",
// "Bahasa Melayu" beside its Jawi); else the browser's name for the base
// language in that language; else the first variant's name.
function familyName(lang, entries) {
  const bare = entries.map((e) => e.name.replace(BRACKETS, ''));
  if (bare.every((s) => s === bare[0]) && bare[0] !== entries[0].name) return bare[0];
  const plain = entries.find((e) => !BRACKETS.test(e.name));
  if (plain) return plain.name;
  try {
    const own = new Intl.DisplayNames([lang], { type: 'language' }).of(lang);
    if (own && own.toLowerCase() !== lang) return own.charAt(0).toLocaleUpperCase(lang) + own.slice(1);
  } catch { /* older browser */ }
  return bare[0];
}

// A name with no brackets is the language in its own script (日本語 beside
// "Nihongo (Romanised)"): the row already says it, so nothing is added.
function variantLabel(entry) {
  const m = entry.name.match(BRACKETS);
  return m ? m[1] : '';
}

// Rows in alphabetical order of the name each row shows, the same order in
// every page language: Latin names A to Z (accents and case ignored, so
// Čeština sits among the Cs), then the other scripts in Unicode's order
// (Greek, Cyrillic, Arabic, the Indian scripts, Thai, Lao, Burmese, Korean,
// Chinese and Japanese). A family's variants keep their registry order in its
// dropdown, so the main variant comes first.
const collator = new Intl.Collator('en', { sensitivity: 'base', numeric: true });

function groupLocales() {
  const byLang = new Map();
  getLocales().forEach((entry) => {
    const lang = entry.code.split('-')[0].toLowerCase();
    if (!byLang.has(lang)) byLang.set(lang, { lang, entries: [] });
    byLang.get(lang).entries.push(entry);
  });
  return [...byLang.values()]
    .map(({ lang, entries }) => ({
      lang,
      name: familyName(lang, entries),
      multi: entries.length > 1,
      entries,
    }))
    .map((fam) => ({ ...fam, label: fam.multi ? fam.name : fam.entries[0].name }))
    .sort((a, b) => collator.compare(a.label, b.label))
    .map((fam, index) => ({ ...fam, index }));
}

function optionButton(entry, className, text) {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = className;
  b.setAttribute('data-locale', entry.code);
  b.setAttribute('lang', entry.code);
  // The language's own name only, no flag (i18n-retrofit-spec.md section 1).
  // The row is laid out in the page's direction, so every row starts on the
  // same side (section 8.1); each name runs in its own script's direction
  // (dir="auto"), so العربية reads right to left on an English page and
  // "English" left to right on an Arabic one.
  const label = document.createElement('span');
  label.className = 'lang-label';
  const name = document.createElement('span');
  name.className = 'lang-own';
  name.dir = 'auto';
  name.textContent = text;
  label.appendChild(name);
  const check = document.createElement('span');
  check.className = 'lang-check';
  check.setAttribute('aria-hidden', 'true');
  check.innerHTML = icon('check');
  b.append(label, check);
  return b;
}

function buildFamily(fam) {
  const item = document.createElement('li');
  item.className = 'lang-item';
  item.setAttribute('data-family', fam.lang);
  const row = document.createElement('div');
  row.className = 'lang-row';
  item.appendChild(row);

  const first = fam.entries[0];
  const head = optionButton(first, 'lang-option lang-head', fam.label);
  head.setAttribute('data-family', fam.lang);
  row.appendChild(head);
  const built = { ...fam, item, row, head, toggle: null, panel: null, variants: [] };

  if (!fam.multi) {
    built.variants.push({ entry: first, button: head });
    return built;
  }

  // The variant this row stands for is shown after the family name.
  const hint = document.createElement('span');
  hint.className = 'lang-variant';
  hint.dir = 'auto';
  // The space keeps the accessible name "English UK", not "EnglishUK".
  head.querySelector('.lang-label').append(' ', hint);

  const panelId = `lang-variants-${fam.lang}`;
  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'lang-more';
  toggle.setAttribute('aria-expanded', 'false');
  toggle.setAttribute('aria-controls', panelId);
  toggle.innerHTML = icon('chevron-down');
  row.appendChild(toggle);

  const panel = document.createElement('ul');
  panel.className = 'lang-variants';
  panel.id = panelId;
  panel.hidden = true;
  for (const entry of fam.entries) {
    const li = document.createElement('li');
    const b = optionButton(entry, 'lang-option lang-sub', entry.name);
    li.appendChild(b);
    panel.appendChild(li);
    built.variants.push({ entry, button: b });
  }
  item.appendChild(panel);
  return { ...built, toggle, panel };
}

function buildModal() {
  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop sheet hidden';
  backdrop.id = MODAL_ID;
  backdrop.innerHTML = `
    <div class="modal glass-card" role="dialog" aria-modal="true" aria-labelledby="lang-title">
      <h2 id="lang-title" data-i18n="language.modal.title"></h2>
      <div class="lang-search">
        ${icon('search')}
        <input type="search" id="lang-search" autocomplete="off" autocapitalize="off"
          spellcheck="false" enterkeyhint="go" aria-controls="lang-list"
          data-i18n-attr="placeholder:language.search.placeholder, aria-label:language.search.label">
      </div>
      <ul class="lang-list" id="lang-list" aria-labelledby="lang-title"></ul>
      <p class="lang-empty" role="status" aria-live="polite"></p>
      <button type="button" class="btn btn-block lang-close" data-i18n="common.close"></button>
    </div>`;
  backdrop.querySelector('#lang-title').textContent = t('language.modal.title');
  backdrop.querySelector('.lang-close').textContent = t('common.close');
  search = backdrop.querySelector('#lang-search');
  search.placeholder = t('language.search.placeholder');
  search.setAttribute('aria-label', t('language.search.label'));
  search.addEventListener('input', filter);
  search.addEventListener('keydown', onSearchKey);

  list = backdrop.querySelector('.lang-list');
  families = groupLocales().map(buildFamily);
  families.forEach((fam) => list.appendChild(fam.item));

  list.addEventListener('click', (e) => {
    const toggle = e.target.closest('.lang-more');
    if (toggle) {
      const fam = familyOf(toggle);
      setExpanded(fam, !isExpanded(fam), true);
      return;
    }
    const option = e.target.closest('.lang-option');
    if (option) choose(option.getAttribute('data-locale'));
  });
  list.addEventListener('keydown', onListKey);
  backdrop.querySelector('.lang-close').addEventListener('click', () => closeModal(MODAL_ID));
  document.body.appendChild(backdrop);
  return backdrop;
}

function familyOf(el) {
  const item = el.closest('.lang-item');
  return families.find((f) => f.item === item);
}

function isExpanded(fam) {
  return Boolean(fam.panel && !fam.panel.hidden);
}

function setExpanded(fam, on, byReader = false) {
  if (!fam.multi) return;
  fam.panel.hidden = !on;
  fam.toggle.setAttribute('aria-expanded', String(on));
  if (byReader) {
    if (on) opened.add(fam.lang);
    else opened.delete(fam.lang);
  }
}

// Which variant a family's row picks: the active one if the reader is using
// this language, else the one closest to the device's languages, else the
// first in the registry.
function preferred(fam) {
  const codes = fam.entries.map((e) => e.code);
  const active = getLocale();
  if (codes.includes(active)) return active;
  return deviceChoice(codes) || codes[0];
}

// The option buttons a reader can see, in order: arrow keys, typeahead and
// Enter in the search box move among these.
function rows() {
  return [...list.querySelectorAll('.lang-option')].filter((b) => !b.closest('[hidden]'));
}

function syncSelection() {
  const active = getLocale();
  for (const fam of families) {
    const inUse = fam.entries.some((e) => e.code === active);
    fam.row.classList.toggle('is-current', inUse);
    setCurrent(fam.head, inUse);
    if (!fam.multi) continue;
    const pick = fam.entries.find((e) => e.code === preferred(fam));
    fam.head.setAttribute('data-locale', pick.code);
    fam.head.setAttribute('lang', pick.code);
    fam.head.querySelector('.lang-variant').textContent = variantLabel(pick);
    fam.toggle.setAttribute('aria-label', t('language.variants', { language: fam.name }));
    for (const v of fam.variants) setCurrent(v.button, v.entry.code === active);
  }
}

function setCurrent(el, on) {
  if (on) el.setAttribute('aria-current', 'true');
  else el.removeAttribute('aria-current');
}

// Search. Matching ignores case and accents, so "francais" finds Français.
const fold = (s) => String(s).normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();

// Language names from the browser (Intl.DisplayNames), so a row can be found
// by its name in the page's current language and in English as well as by its
// own name: "chinese" or "british" find a row whose own name says neither.
function displayNames(inLocale) {
  const names = [];
  for (const languageDisplay of ['dialect', 'standard']) {
    try { names.push(new Intl.DisplayNames([inLocale], { type: 'language', languageDisplay })); }
    catch { /* older browser: own name and code still match */ }
  }
  return names;
}

const haystacks = { locale: null, text: new Map() };

function regionNames(inLocale) {
  try { return [new Intl.DisplayNames([inLocale], { type: 'region' })]; }
  catch { return []; }
}

// The countries a language comes from, as ISO codes: the registry's `regions`
// where it lists them, else the code's own region (zh-SG), else the browser's
// likeliest region for the language (ja → JP). Never "world" (eo → 001).
function regionsOf(entry) {
  if (Array.isArray(entry.regions) && entry.regions.length) return entry.regions;
  try {
    const loc = new Intl.Locale(entry.code);
    const region = loc.region || loc.maximize().region;
    return region && /^[A-Z]{2}$/.test(region) ? [region] : [];
  } catch {
    return [];
  }
}

// Everything a variant can be found by: its own name, its family's name, its
// English names from the registry (`en`), its name in the page's language and
// in English from the browser, the names of its countries of origin in both,
// and its code written as en-gb, en_gb or engb.
function haystack(entry, family, namers, regioners) {
  const code = entry.code.toLowerCase();
  const words = [entry.name, family, code, code.replace(/-/g, '_'), code.replace(/-/g, '')];
  words.push(...[].concat(entry.en || []));
  for (const namer of namers) {
    try { words.push(namer.of(entry.code)); } catch { /* code Intl does not know */ }
  }
  for (const region of regionsOf(entry)) {
    for (const namer of regioners) {
      try { words.push(namer.of(region)); } catch { /* region Intl does not know */ }
    }
  }
  return words.filter(Boolean).map(fold).join('\n');
}

// How well a match fits the query's first word: 0 its code or base language
// exactly ("en" for en-GB), 1 the start of a word in one of its names or
// codes, 2 anywhere. Rows sort by this, so "en" puts English above French
// (whose name merely contains "en") and Enter picks it.
function rank(entry, text, first) {
  if (!first) return 0;
  const code = entry.code.toLowerCase();
  if (code === first || code.split('-')[0] === first) return 0;
  const words = text.split(/[^\p{L}\p{N}_-]+/u);
  return words.some((w) => w.startsWith(first)) ? 1 : 2;
}

// Each word of the query must appear somewhere in a variant's haystack, so
// "english uk", "uk eng" and "en-gb" all find English (UK). A family shows
// when any of its variants match. When the search narrows a family to some
// of its variants ("us" for English), its dropdown opens on just those.
function filter() {
  if (!search || !list) return;
  const query = search.value.trim();
  const terms = fold(query).replace(/_/g, '-').split(/\s+/).filter(Boolean);
  // Haystacks depend only on the page's language, so they are built once per
  // language rather than on every keystroke.
  if (haystacks.locale !== getLocale()) {
    haystacks.locale = getLocale();
    haystacks.text.clear();
  }
  let namers = null;
  let regioners = null;
  const textOf = (entry, family) => {
    if (!haystacks.text.has(entry.code)) {
      namers = namers || [...displayNames(getLocale()), ...displayNames('en')];
      regioners = regioners || [...regionNames(getLocale()), ...regionNames('en')];
      haystacks.text.set(entry.code, haystack(entry, family, namers, regioners));
    }
    return haystacks.text.get(entry.code);
  };
  const order = [];
  let showing = 0;
  for (const fam of families) {
    let best = 3;
    let matches = 0;
    for (const v of fam.variants) {
      const text = textOf(v.entry, fam.name);
      v.match = terms.every((term) => text.includes(term));
      if (fam.multi) v.button.parentElement.hidden = !v.match;
      if (v.match) {
        matches += 1;
        best = Math.min(best, rank(v.entry, text, terms[0]));
      }
    }
    fam.item.hidden = matches === 0;
    fam.narrowed = terms.length > 0 && matches > 0 && matches < fam.variants.length;
    if (terms.length > 0) setExpanded(fam, fam.narrowed);
    else setExpanded(fam, opened.has(fam.lang));
    if (matches > 0) showing += 1;
    order.push({ fam, score: best });
  }
  // Best fit first, alphabetical within each; an empty query restores it.
  order.sort((a, b) => a.score - b.score || a.fam.index - b.fam.index);
  // Rows move only when the order changes: moving a focused row drops focus.
  const moved = order.some(({ fam }, n) => list.children[n] !== fam.item);
  if (moved) order.forEach(({ fam }) => list.appendChild(fam.item));
  const empty = document.querySelector(`#${MODAL_ID} .lang-empty`);
  if (empty) empty.textContent = showing === 0 ? t('language.search.empty', { query }) : '';
  syncSelection();
}

// Enter in the search box picks the top result: the family's own pick, or,
// when the search narrowed it ("us"), the first variant left.
function topResult() {
  const top = [...list.children].find((li) => !li.hidden);
  const fam = top && families.find((f) => f.item === top);
  if (!fam) return undefined;
  if (fam.narrowed) return fam.variants.find((v) => v.match).entry.code;
  return fam.multi ? preferred(fam) : fam.entries[0].code;
}

function onSearchKey(e) {
  switch (e.key) {
    case 'ArrowDown':
      e.preventDefault();
      focusRow(0);
      break;
    case 'Enter': {
      e.preventDefault();
      const code = topResult();
      if (code) choose(code);
      break;
    }
    case 'Escape':
      // The first Escape clears the search; the next one closes the dialog
      // (js/ui.js listens on document, so stopping here keeps it open).
      if (search.value) {
        e.preventDefault();
        e.stopPropagation();
        search.value = '';
        filter();
      }
      break;
    default:
  }
}

function focusRow(index) {
  const all = rows();
  if (all.length === 0) return;
  all[(index + all.length) % all.length].focus();
}

function onListKey(e) {
  const all = rows();
  const focused = document.activeElement;
  // On a dropdown button, arrows act for its row.
  const anchor = focused && focused.classList.contains('lang-more')
    ? familyOf(focused).head
    : focused;
  const index = all.indexOf(anchor);
  const rtl = document.documentElement.dir === 'rtl';
  const openKey = rtl ? 'ArrowLeft' : 'ArrowRight';
  const closeKey = rtl ? 'ArrowRight' : 'ArrowLeft';
  const fam = anchor && anchor.closest ? familyOf(anchor) : null;
  switch (e.key) {
    case 'ArrowDown': e.preventDefault(); focusRow(index + 1); break;
    case 'ArrowUp':
      e.preventDefault();
      // Up from the first row goes back to the search box.
      if (index <= 0 && search) search.focus();
      else focusRow(index - 1);
      break;
    case 'Home': e.preventDefault(); focusRow(0); break;
    case 'End': e.preventDefault(); focusRow(all.length - 1); break;
    case openKey:
      // Opens a row's variants and moves to the first.
      if (fam && fam.multi && anchor === fam.head) {
        e.preventDefault();
        setExpanded(fam, true, true);
        const firstVariant = rows().find((b) => fam.panel.contains(b));
        if (firstVariant) firstVariant.focus();
      }
      break;
    case closeKey:
      // Closes them again, from the row or from a variant.
      if (fam && fam.multi && isExpanded(fam)) {
        e.preventDefault();
        setExpanded(fam, false, true);
        fam.head.focus();
      }
      break;
    default:
      // Typing a letter jumps to the next row starting with it.
      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const letter = e.key.toLocaleLowerCase();
        for (let step = 1; step <= all.length; step += 1) {
          const n = (index + step) % all.length;
          if (all[n].textContent.trim().toLocaleLowerCase().startsWith(letter)) {
            all[n].focus();
            break;
          }
        }
      }
  }
}

function choose(code) {
  // Selecting the active language just closes.
  if (code !== getLocale()) setLocale(code);
  closeModal(MODAL_ID);
}

function open() {
  // Each visit starts with the whole list, every dropdown closed.
  if (search) search.value = '';
  opened.clear();
  filter();
  const active = getLocale();
  const fam = families.find((f) => f.entries.some((e) => e.code === active));
  openModal(MODAL_ID, {
    initialFocus: fam ? fam.head : null,
    onClose: () => button && button.setAttribute('aria-expanded', 'false'),
  });
  button.setAttribute('aria-expanded', 'true');
}

export function mountSwitcher(slot) {
  if (!slot) return;
  button = document.createElement('button');
  button.type = 'button';
  button.className = 'lang-btn';
  button.setAttribute('aria-haspopup', 'dialog');
  button.setAttribute('aria-expanded', 'false');
  button.setAttribute('aria-controls', MODAL_ID);
  slot.replaceChildren(button);
  renderButton();
  buildModal();
  button.addEventListener('click', open);
  onChange(() => {
    renderButton();
    // Names in the page's language, the dropdown labels and the no-match
    // line follow the switch.
    filter();
  });
}
