// The gallery's photos come from /photos.json, one entry per photo, in the
// order shown: the file, its caption, and its size. Add a photo with
// `python tools/photos.py add <file> "<caption>"`, which copies the file into
// assets/ and writes the entry; nothing in the page code changes.

import { hydrateBlobImages } from './blob-images.js';

export async function loadPhotos() {
  try {
    const response = await fetch('/photos.json');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const list = await response.json();
    return list.filter((photo) => photo && photo.src && photo.alt);
  } catch (cause) {
    console.warn('photos.json could not be read:', cause);
    return [];
  }
}

// The photos as an ordinary list. It is the gallery itself when the scene is
// off, and the accessible version of the 3D ring when it is on (CSS keeps it
// for screen readers and hides it from view).
export function renderPhotoList(list, photos) {
  if (!list) return;
  list.replaceChildren();
  for (const photo of photos) {
    const item = document.createElement('li');
    const figure = document.createElement('figure');
    const image = document.createElement('img');
    image.dataset.src = photo.src;
    image.alt = photo.alt;
    image.decoding = 'async';
    if (photo.width && photo.height) {
      image.width = photo.width;
      image.height = photo.height;
    }
    // The same words as the alt text, for sighted readers; hidden from screen
    // readers so they hear each title once.
    const caption = document.createElement('figcaption');
    caption.textContent = photo.alt;
    caption.setAttribute('aria-hidden', 'true');
    figure.append(image, caption);
    item.append(figure);
    list.append(item);
  }
  hydrateBlobImages(list);
  list.closest('[aria-busy]')?.setAttribute('aria-busy', 'false');
}
