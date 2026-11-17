// Dialogs, from gftv-helloevents' js/ui.js. Opening one moves focus inside,
// traps it there, makes the rest of the page inert and locks scrolling.
// Escape, the backdrop, and any [data-close-modal] close it and return focus
// to where it was. Show and hide is one .hidden class flip; the timing lives
// in CSS.

const openDialogs = [];

function focusable(root) {
  const candidates = [...root.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])')];
  return candidates.filter((element) => !element.closest('[hidden]') && element.offsetParent !== null);
}

function setBackgroundInert(makeInert) {
  for (const child of document.body.children) {
    if (child.classList.contains('modal-backdrop')) continue;
    if (makeInert) child.setAttribute('inert', '');
    else child.removeAttribute('inert');
  }
  document.documentElement.style.overflow = makeInert ? 'hidden' : '';
}

export function openModal(id, { initialFocus = null, onClose = null } = {}) {
  const backdrop = document.getElementById(id);
  if (!backdrop || !backdrop.classList.contains('hidden')) return;
  openDialogs.forEach((entry) => entry.backdrop.setAttribute('inert', ''));
  openDialogs.push({ id, backdrop, returnTo: document.activeElement, onClose });
  backdrop.style.zIndex = String(50 + openDialogs.length);
  backdrop.removeAttribute('inert');
  backdrop.classList.remove('hidden');
  setBackgroundInert(true);
  const target = initialFocus || focusable(backdrop)[0];
  if (target) target.focus();
}

export function closeModal(id) {
  const index = openDialogs.findIndex((entry) => entry.id === id);
  if (index < 0) return;
  const [entry] = openDialogs.splice(index, 1);
  entry.backdrop.classList.add('hidden');
  if (openDialogs.length === 0) setBackgroundInert(false);
  else openDialogs[openDialogs.length - 1].backdrop.removeAttribute('inert');
  if (entry.onClose) entry.onClose();
  if (entry.returnTo && typeof entry.returnTo.focus === 'function') entry.returnTo.focus();
}

export function wireModals() {
  document.addEventListener('click', (event) => {
    const closer = event.target.closest('[data-close-modal]');
    if (closer) {
      closeModal(closer.getAttribute('data-close-modal'));
      return;
    }
    if (event.target.classList && event.target.classList.contains('modal-backdrop')) {
      closeModal(event.target.id);
    }
  });
  // Escape closes the top dialog; Tab and Shift+Tab stay inside it.
  document.addEventListener('keydown', (event) => {
    const topDialog = openDialogs[openDialogs.length - 1];
    if (!topDialog) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      closeModal(topDialog.id);
      return;
    }
    if (event.key !== 'Tab') return;
    const items = focusable(topDialog.backdrop);
    if (items.length === 0) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    } else if (!topDialog.backdrop.contains(document.activeElement)) {
      event.preventDefault();
      first.focus();
    }
  });
}

export function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
