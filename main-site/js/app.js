// The home page: the shared chrome, the photo list, and the 3D scene when
// scene-flag.js turned it on.

import { initChrome } from './chrome.js';
import { loadPhotos, renderPhotoList } from './photos.js';

// The static layout, for when the scene is off or cannot start.
function sceneOff() {
  document.documentElement.classList.remove('scene-on');
  document.documentElement.classList.add('scene-off');
}

async function startScene(photos) {
  if (!document.documentElement.classList.contains('scene-on')) return;
  try {
    const { startScene: start } = await import('./scene/main.js');
    start({ photos, onFail: sceneOff });
  } catch (cause) {
    console.warn('3D scene unavailable, showing the static page:', cause);
    sceneOff();
  }
  // Somebody who turns on reduced motion mid-visit gets the static page from
  // the next reload on; switching layouts under them would move the page.
}

initChrome();

const photos = await loadPhotos();
renderPhotoList(document.getElementById('photoList'), photos);
startScene(photos);
