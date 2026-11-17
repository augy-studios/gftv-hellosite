// The gallery's photos come from /photos.json, one entry per photo, in the
// order shown. Add a photo with `python tools/photos.py add <file> "<alt>"`,
// which writes the web copy and the entry; nothing in the page code changes.

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
    image.src = photo.src;
    image.alt = photo.alt;
    image.loading = 'lazy';
    image.decoding = 'async';
    if (photo.width && photo.height) {
      image.width = photo.width;
      image.height = photo.height;
    }
    figure.append(image);
    item.append(figure);
    list.append(item);
  }
  list.closest('[aria-busy]')?.setAttribute('aria-busy', 'false');
}
