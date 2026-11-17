// The 3D scene: one fixed, full-screen canvas behind the page, one renderer,
// one camera that moves with the scroll.
//
// Scene units are page pixels. The camera's field of view and distance are
// set so that anything at z = 0 appears at exactly its page size, and the
// camera sits over the middle of the screen, so a point at page position
// (x, y) is at scene position (x - width / 2, -y, 0). That is what lets the
// card, the ring and the bowl sit exactly over their anchor elements, and
// the smile line be laid along the page itself. Depth is in pixels too: the
// line swings out towards the reader and far back behind the page.
//
// Parts (each a module with layout() on every layout change and update()
// every frame):
//   card.js        the name card in the pinned hero, turning over, and the
//                  hero's timeline
//   smile-face.js  the card's smile, dropping off it to below the card
//   smile-line.js  the line from the smile's mouth to the closing smile
//   ring.js        the photo ring in the gallery chapter
//   bowl.js        the ramen bowl in the Takagi chapter
//   shapes.js      the background shapes, drawn first in a pass of their own

import {
  DirectionalLight,
  HemisphereLight,
  PerspectiveCamera,
  Scene,
  WebGLRenderer,
} from '../vendor/three.module.min.js';
import { NameCard } from './card.js';
import { SmileFace } from './smile-face.js';
import { SmileLine } from './smile-line.js';
import { PhotoRing } from './ring.js';
import { RamenBowl } from './bowl.js';
import { Shapes } from './shapes.js';
import { onThemeChange, readTheme } from './colours.js';

const FIELD_OF_VIEW = 30;

export function startScene({ photos, onFail }) {
  const canvas = document.getElementById('scene');
  if (!canvas) return;

  let renderer;
  try {
    renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  } catch (cause) {
    console.warn('WebGL could not start:', cause);
    onFail();
    return;
  }
  renderer.setClearColor(0x000000, 0);
  // Cleared by hand, so the background shapes can be drawn first and the
  // rest drawn over them.
  renderer.autoClear = false;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

  const scene = new Scene();
  const camera = new PerspectiveCamera(FIELD_OF_VIEW, 1, 1, 10000);
  // Lights only touch the bowl (toon shaded); the card, line and photos are
  // unlit and show their own colours.
  scene.add(new HemisphereLight(0xffffff, 0x6a6050, 1.6));
  const sun = new DirectionalLight(0xffffff, 2.2);
  sun.position.set(0.4, 1, 0.8);
  scene.add(sun);

  const card = new NameCard(scene, renderer);
  const face = new SmileFace(scene);
  const line = new SmileLine(scene);
  const ring = new PhotoRing(scene, renderer, photos);
  const bowl = new RamenBowl(scene);
  // The background shapes are a scene of their own, drawn before the main one
  // with the depth cleared in between, so they are behind everything else
  // whatever their depth. (In one scene, being see-through, they would be
  // drawn last and land on top.)
  const backdrop = new Scene();
  const shapes = new Shapes(backdrop);

  const view = { width: 1, height: 1, scrollY: 0, maxScroll: 0 };

  function measure() {
    view.width = canvas.clientWidth || window.innerWidth;
    view.height = canvas.clientHeight || window.innerHeight;
    view.scrollY = window.scrollY;
    view.maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
  }

  function layout() {
    measure();
    renderer.setSize(view.width, view.height, false);
    const distance = (view.height / 2) / Math.tan((FIELD_OF_VIEW * Math.PI) / 360);
    // The camera's distance from the page, for anything that has to work out
    // where a point at some depth shows on screen.
    view.distance = distance;
    camera.aspect = view.width / view.height;
    camera.position.z = distance;
    camera.near = distance * 0.02;
    camera.far = distance * 6;
    camera.updateProjectionMatrix();
    card.layout(view);
    face.layout(view);
    line.layout(view, face, card.pin(view));
    ring.layout(view);
    bowl.layout(view);
    shapes.layout(view);
  }

  function applyTheme() {
    const theme = readTheme();
    face.setTheme(theme);
    line.setTheme(theme);
    ring.setTheme(theme);
    shapes.setTheme(theme);
  }

  let last = performance.now();
  let running = true;
  function frame(now) {
    if (!running) return;
    const seconds = Math.min(0.1, (now - last) / 1000);
    last = now;
    measure();
    camera.position.set(0, -(view.scrollY + view.height / 2), camera.position.z);

    card.update(view);
    face.update(view, seconds, card.progress);
    line.update(view, seconds, card.progress);
    ring.update(view, seconds, now / 1000);
    bowl.update(view, seconds, now / 1000);
    shapes.update(view);

    renderer.clear();
    renderer.render(backdrop, camera);
    renderer.clearDepth();
    renderer.render(scene, camera);
    requestAnimationFrame(frame);
  }

  // Layout follows the page: a new size, the fonts arriving, the photo list
  // filling in. Batched to one rebuild per burst of changes.
  let pending = null;
  function relayout() {
    clearTimeout(pending);
    pending = setTimeout(layout, 120);
  }
  window.addEventListener('resize', relayout);
  new ResizeObserver(relayout).observe(document.body);
  document.fonts?.ready.then(relayout);

  onThemeChange(applyTheme);

  canvas.addEventListener('webglcontextlost', (event) => {
    event.preventDefault();
    running = false;
    document.documentElement.classList.remove('scene-ready');
    onFail();
  });

  applyTheme();
  layout();
  requestAnimationFrame(frame);

  // Swap the card picture for the 3D card only once the card has its faces
  // and a frame has been drawn with them, so the hero never blinks.
  card.ready
    .then(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))))
    .then(() => document.documentElement.classList.add('scene-ready'))
    .catch((cause) => {
      console.warn('The name card could not be loaded:', cause);
      running = false;
      onFail();
    });
}
