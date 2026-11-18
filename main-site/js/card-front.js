// Which front the hero's name card shows. English (uwu) has its own, saying
// "Hewwo!" (assets/12Ann Front uwu.png, made from the original by
// tools/make-hewwo.py); every other language shows the printed card.
//
// The hero's picture and the 3D card (js/scene/card.js) both follow it, and
// both switch when the language does.

import { getLocale, onChange } from '../assets/i18n/i18n.js';
import { blobUrl } from './blob-images.js';

export const CARD_FRONT = '/assets/12Ann%20Front.png';
const CARD_FRONT_UWU = '/assets/12Ann%20Front%20uwu.png';

export function cardFront() {
  return getLocale() === 'en-UWU' ? CARD_FRONT_UWU : CARD_FRONT;
}

// Calls fn with the new front's path whenever the language changes it.
export function onCardFrontChange(fn) {
  let current = cardFront();
  return onChange(() => {
    const next = cardFront();
    if (next === current) return;
    current = next;
    fn(next);
  });
}

// Points the hero's picture at the right front. Runs before
// hydrateBlobImages(), so the first fetch is already the right file.
export function initCardFront() {
  const image = document.querySelector('.name-card-face');
  if (!image) return;
  if (image.dataset.src) image.dataset.src = cardFront();
  onCardFrontChange((src) => {
    blobUrl(src)
      .then((url) => { image.src = url; })
      .catch((cause) => console.warn('card picture not loaded:', cause));
  });
}
