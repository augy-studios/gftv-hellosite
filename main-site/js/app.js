// The home page: the shared chrome, the photo list, and the 3D scene when
// scene-flag.js turned it on.

import { initChrome } from './chrome.js';
import { loadPhotos, renderPhotoList } from './photos.js';
import { showStaticBackdrop } from './backdrop-static.js';
import { initLiquidGlass } from './liquid-glass.js';
import { initSectionDots } from './section-dots.js';

// The static layout, for when the scene is off or cannot start: the same
// content, with the background shapes as still pictures.
function sceneOff() {
  document.documentElement.classList.remove('scene-on');
  document.documentElement.classList.add('scene-off');
  showStaticBackdrop();
}

// The hero's stage is pinned at the height it starts at, just below the
// official bar and the header, rather than at the top of the screen: pinned at
// the top, the first scroll would carry the card up under the header before
// the pin took hold. Measured from the page, and again whenever the bar or the
// header change height (a narrower screen, the bar's panel opened).
function pinHeroWhereItStarts() {
  const hero = document.getElementById('hello');
  if (!hero) return;
  const measure = () => {
    const top = hero.getBoundingClientRect().top + window.scrollY;
    document.documentElement.style.setProperty('--hero-top', `${Math.max(0, Math.round(top))}px`);
  };
  measure();
  const watch = new ResizeObserver(measure);
  for (const element of [document.getElementById('officialBar'), document.querySelector('.site-header')]) {
    if (element) watch.observe(element);
  }
  window.addEventListener('resize', measure);
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
initLiquidGlass();
initSectionDots();
if (document.documentElement.classList.contains('scene-off')) showStaticBackdrop();
else pinHeroWhereItStarts();

const photos = await loadPhotos();
renderPhotoList(document.getElementById('photoList'), photos);
startScene(photos);
