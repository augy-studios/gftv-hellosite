// The chrome every page shares: theme, icons, pictures (as blob: URLs),
// dialogs, the update bar, the sticky header and the footer year. Adapted from gftv-helloevents'
// js/app.js, English only. index.html runs it through app.js, which adds the
// photos and the 3D scene; 404.html through page.js.

import {
  COLOR_THEMES,
  initTheme,
  applyColorTheme,
  applyMode,
  getStoredColorTheme,
  getStoredMode,
  getModePreference,
  LIGHT_FROM_HOUR,
  LIGHT_UNTIL_HOUR,
} from './theme.js';
import { icon, hydrateIcons } from './icons.js';
import { openModal, wireModals } from './ui.js';
import { initUpdateBar } from './update-bar.js';
import { hydrateBlobImages } from './blob-images.js';

const MODE_NAMES = { light: 'Light', dark: 'Dark', time: 'Time-based' };

// "09:00" for 9.
function hourLabel(hour) {
  return `${String(hour).padStart(2, '0')}:00`;
}

function syncThemeButton() {
  const themeButton = document.getElementById('themeBtn');
  if (!themeButton) return;
  const mode = getStoredMode();
  themeButton.innerHTML = icon(mode === 'dark' ? 'moon' : 'sun');
  themeButton.setAttribute('aria-label', `Theme, ${MODE_NAMES[mode]} mode`);
}

// Brings the theme dialog in line with what is stored: the pressed mode
// button, the note under "Time-based" saying which mode is on now, the chosen
// colour swatch, and the header's theme button.
function syncThemeModal() {
  const preference = getModePreference();
  const resolved = getStoredMode();
  const colorTheme = getStoredColorTheme();

  document.querySelectorAll('#modeToggle .mode-btn').forEach((modeButton) => {
    const active = modeButton.dataset.mode === preference;
    modeButton.classList.toggle('active', active);
    modeButton.setAttribute('aria-pressed', String(active));
  });

  const note = document.getElementById('modeNote');
  if (note) {
    if (preference === 'time') {
      note.textContent = `Light from ${hourLabel(LIGHT_FROM_HOUR)} to ${hourLabel(LIGHT_UNTIL_HOUR)}, dark otherwise, by your device's clock. ${MODE_NAMES[resolved]} right now.`;
      note.hidden = false;
    } else {
      note.hidden = true;
      note.textContent = '';
    }
  }

  document.querySelectorAll('#swatchGrid .swatch').forEach((swatch) => {
    const active = swatch.dataset.theme === colorTheme;
    swatch.classList.toggle('active', active);
    swatch.setAttribute('aria-pressed', String(active));
  });

  syncThemeButton();
}

// Built with the DOM and style.setProperty rather than an inline style
// attribute, which the Content-Security-Policy would refuse.
function buildSwatches() {
  const grid = document.getElementById('swatchGrid');
  if (!grid) return;
  grid.replaceChildren();
  for (const theme of COLOR_THEMES) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'swatch';
    button.dataset.theme = theme.id;
    button.setAttribute('aria-pressed', 'false');
    button.style.setProperty('--swatch-color', theme.hex);
    const dot = document.createElement('span');
    dot.className = 'swatch-dot';
    dot.setAttribute('aria-hidden', 'true');
    const label = document.createElement('span');
    label.textContent = theme.label;
    button.append(dot, label);
    grid.appendChild(button);
  }
}

function wireTheme() {
  buildSwatches();

  const themeButton = document.getElementById('themeBtn');
  if (themeButton) {
    themeButton.addEventListener('click', () => {
      syncThemeModal();
      openModal('themeModal');
    });
  }

  // Picking a mode or a swatch updates the modal in place and leaves it open.
  document.getElementById('modeToggle')?.addEventListener('click', (event) => {
    const modeButton = event.target.closest('.mode-btn');
    if (!modeButton) return;
    applyMode(modeButton.dataset.mode);
    syncThemeModal();
  });

  document.getElementById('swatchGrid')?.addEventListener('click', (event) => {
    const swatch = event.target.closest('.swatch');
    if (!swatch) return;
    applyColorTheme(swatch.dataset.theme);
    syncThemeModal();
  });

  // A tab left open across 09:00 or 18:00 redraws rather than showing the
  // answer from before dinner.
  document.addEventListener('gftv:modechange', syncThemeModal);
  syncThemeModal();
}

// The header gets the "stuck" class while the page is scrolled down, checked
// at most once a frame.
function wireStickyHeader() {
  const header = document.querySelector('.site-header');
  if (!header) return;
  let ticking = false;
  const update = () => {
    ticking = false;
    header.classList.toggle('stuck', header.getBoundingClientRect().top <= 0 && window.scrollY > 0);
  };
  window.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(update);
  }, { passive: true });
  update();
}

function wireFooterYear() {
  const yearElement = document.getElementById('currentYear');
  if (yearElement) yearElement.textContent = String(new Date().getFullYear());
}

export function initChrome() {
  initTheme();
  hydrateIcons();
  hydrateBlobImages();
  wireModals();
  wireTheme();
  wireStickyHeader();
  wireFooterYear();
  initUpdateBar();
}
