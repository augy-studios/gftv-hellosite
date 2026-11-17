// Every picture the site shows is fetched as bytes and shown through a blob:
// URL, so opening one in a new tab, or copying its address, gives a blob: URL
// rather than the file's path on the site. The pattern from
// docs/hide-images-spec.md, part 3.
//
// In the markup a picture carries its file in data-src instead of src. The 3D
// scene asks blobUrl() for the same files, and one cache serves both, so each
// file is fetched once however many places show it. The blob: URLs live as
// long as the page: nothing that holds one goes away before then.

const cache = new Map();

// A blob: URL for `src`, fetched once.
export function blobUrl(src) {
  if (!cache.has(src)) {
    cache.set(src, fetch(src)
      .then((response) => {
        if (!response.ok) throw new Error(`${src}: HTTP ${response.status}`);
        return response.blob();
      })
      .then((blob) => URL.createObjectURL(blob)));
  }
  return cache.get(src);
}

function show(image) {
  const src = image.dataset.src;
  if (!src) return;
  image.removeAttribute('data-src');
  blobUrl(src)
    .then((url) => { image.src = url; })
    .catch((cause) => console.warn('picture not loaded:', cause));
}

// Fetched as they come near the screen, like loading="lazy" would; those
// marked data-eager (the hero's card) straight away.
const nearScreen = 'IntersectionObserver' in window
  ? new IntersectionObserver((entries, observer) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      observer.unobserve(entry.target);
      show(entry.target);
    }
  }, { rootMargin: '150% 0px' })
  : null;

export function hydrateBlobImages(root = document) {
  root.querySelectorAll('img[data-src]').forEach((image) => {
    if (image.hasAttribute('data-eager') || !nearScreen) show(image);
    else nearScreen.observe(image);
  });
}
