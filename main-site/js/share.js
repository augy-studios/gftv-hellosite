// The "Share the page" button in the footer, and its dialog: a QR code for
// the site with the HelloSpot icon in the middle, and buttons to download,
// copy or share it. Drawn the way the GFTV Redirects Portal draws its QR
// codes (gftv-redirects-portal, script.js, createQrCompositeImage): a white
// card with the code at high error correction, so the icon can cover its
// middle, on a white pad, and the address under it.
//
// The QR encoder is vendored (js/vendor/qrcode.module.js, MIT) and loaded
// the first time the dialog opens. The colours are the --qr-bg and --qr-fg
// tokens: dark on light in every theme, because scanners need it that way.
// Its words are share.* in assets/i18n/en-GB.json.

import { t, onChange } from '../assets/i18n/i18n.js';
import { openModal } from './ui.js';

// Always the live site, whichever address the page was opened at, so a code
// made on a preview deploy or a 404 still leads to the HelloSpot.
const SHARE_URL = 'https://hello.globalfurry.tv/';
const SHOWN_URL = 'hello.globalfurry.tv';
const ICON_URL = '/HSP-512.png';
const FILE_NAME = 'gftv-hellospot-qr.png';

// The picture, in canvas pixels. Shown at about half this, so it stays sharp
// on high density screens and in the downloaded file.
const TARGET_WIDTH = 640;
const QUIET_MODULES = 4; // the white margin scanners need, in modules
const ICON_SHARE = 0.22; // the icon's width as a share of the code's

let canvas = null;
let pngBlob = null;
let drawing = null;
let statusKey = '';
let statusTimer = 0;

function token(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}

function roundedRect(context, x, y, width, height, radius) {
  context.beginPath();
  context.moveTo(x + radius, y);
  context.arcTo(x + width, y, x + width, y + height, radius);
  context.arcTo(x + width, y + height, x, y + height, radius);
  context.arcTo(x, y + height, x, y, radius);
  context.arcTo(x, y, x + width, y, radius);
  context.closePath();
}

async function drawQr() {
  const { default: qrcode } = await import('./vendor/qrcode.module.js');
  const code = qrcode(0, 'H');
  code.addData(SHARE_URL);
  code.make();

  const count = code.getModuleCount();
  const cell = Math.ceil(TARGET_WIDTH / (count + QUIET_MODULES * 2));
  const quiet = QUIET_MODULES * cell;
  const codeSize = count * cell;
  const width = codeSize + quiet * 2;
  // The address goes under the whole quiet zone, then a margin.
  const fontSize = Math.round(width * 0.045);
  const captionY = width + Math.round(fontSize * 0.2);
  const height = captionY + fontSize + Math.round(quiet * 0.75);

  const background = token('--qr-bg') || '#ffffff';
  const foreground = token('--qr-fg') || '#000000';

  const picture = document.createElement('canvas');
  picture.width = width;
  picture.height = height;
  const context = picture.getContext('2d');
  context.fillStyle = background;
  context.fillRect(0, 0, width, height);

  // Whole pixels per module, so the edges stay crisp.
  context.fillStyle = foreground;
  for (let row = 0; row < count; row += 1) {
    for (let column = 0; column < count; column += 1) {
      if (code.isDark(row, column)) context.fillRect(quiet + column * cell, quiet + row * cell, cell, cell);
    }
  }

  // The icon in the middle, on a white pad. Level H error correction lets
  // the code lose about 30% of itself; the pad covers about 8%. Without the
  // icon file, the code is drawn without it.
  try {
    const icon = await loadImage(ICON_URL);
    const iconSize = Math.round(codeSize * ICON_SHARE);
    const pad = Math.round(cell * 0.75);
    const iconX = Math.round((width - iconSize) / 2);
    const iconY = Math.round(quiet + (codeSize - iconSize) / 2);
    context.fillStyle = background;
    roundedRect(context, iconX - pad, iconY - pad, iconSize + pad * 2, iconSize + pad * 2, Math.round(iconSize * 0.2 + pad));
    context.fill();
    context.save();
    roundedRect(context, iconX, iconY, iconSize, iconSize, Math.round(iconSize * 0.2));
    context.clip();
    context.drawImage(icon, iconX, iconY, iconSize, iconSize);
    context.restore();
  } catch { /* drawn without the icon */ }

  // The address under the code, in the page's font.
  const family = getComputedStyle(document.body).fontFamily;
  const font = `600 ${fontSize}px ${family}`;
  try { await document.fonts.load(font, SHOWN_URL); } catch { /* the fallback font will do */ }
  context.fillStyle = foreground;
  context.font = font;
  context.direction = 'ltr';
  context.textAlign = 'center';
  context.textBaseline = 'top';
  context.fillText(SHOWN_URL, width / 2, captionY, codeSize);

  picture.setAttribute('role', 'img');
  picture.setAttribute('aria-label', t('share.qr-alt', { url: SHOWN_URL }));
  // Made now, not on click: Safari only lets a tap share or copy for a moment.
  pngBlob = await new Promise((resolve) => picture.toBlob(resolve, 'image/png'));
  return picture;
}

function setStatus(key, isError = false) {
  const status = document.getElementById('shareStatus');
  if (!status) return;
  clearTimeout(statusTimer);
  statusKey = key;
  status.textContent = key ? t(key) : '';
  status.classList.toggle('error', isError);
  if (key) statusTimer = setTimeout(() => setStatus(''), 4000);
}

function setActionsEnabled(enabled) {
  document.querySelectorAll('#shareModal [data-share-action]').forEach((button) => {
    button.disabled = !enabled;
  });
}

async function showQr() {
  const holder = document.getElementById('shareQr');
  if (!holder) return;
  if (canvas) return;
  if (!drawing) {
    holder.classList.add('skeleton');
    setActionsEnabled(false);
    drawing = drawQr();
  }
  try {
    canvas = await drawing;
    holder.classList.remove('skeleton');
    holder.replaceChildren(canvas);
    setActionsEnabled(Boolean(pngBlob));
  } catch {
    drawing = null;
    holder.classList.remove('skeleton');
    setStatus('share.failed', true);
  }
}

function download() {
  if (!pngBlob) return;
  const link = document.createElement('a');
  link.href = URL.createObjectURL(pngBlob);
  link.download = FILE_NAME;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(link.href), 5000);
}

async function copy() {
  if (!pngBlob) return;
  try {
    await navigator.clipboard.write([new ClipboardItem({ 'image/png': pngBlob })]);
    setStatus('share.copied');
  } catch {
    setStatus('share.failed', true);
  }
}

// The picture and the link where the device can share files, the link alone
// where it can share only that, and otherwise the link copied.
async function share() {
  if (!pngBlob) return;
  const file = new File([pngBlob], FILE_NAME, { type: 'image/png' });
  const title = t('site.name');
  try {
    if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({ title, text: SHARE_URL, files: [file] });
    } else if (navigator.share) {
      await navigator.share({ title, url: SHARE_URL });
    } else {
      await navigator.clipboard.writeText(SHARE_URL);
      setStatus('share.link-copied');
    }
  } catch (error) {
    if (error && error.name === 'AbortError') return;
    setStatus('share.failed', true);
  }
}

const ACTIONS = { download, copy, share };

export function initShare() {
  const button = document.getElementById('shareBtn');
  const modal = document.getElementById('shareModal');
  if (!button || !modal) return;

  button.addEventListener('click', () => {
    setStatus('');
    openModal('shareModal');
    showQr();
  });

  modal.addEventListener('click', (event) => {
    const action = event.target.closest('[data-share-action]');
    if (action && !action.disabled) ACTIONS[action.dataset.shareAction]?.();
  });

  // Words set in code follow the language.
  onChange(() => {
    if (canvas) canvas.setAttribute('aria-label', t('share.qr-alt', { url: SHOWN_URL }));
    const status = document.getElementById('shareStatus');
    if (status && statusKey) status.textContent = t(statusKey);
  });
}
