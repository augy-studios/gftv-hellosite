// The name card, front and back, drawn exactly over the hero's card picture
// (#cardAnchor), and the hero's timeline.
//
// The hero is pinned: its stage is sticky, so while the reader scrolls
// through it the page holds still. Over the first part of that scroll the
// card turns all the way over to its back, while its smile (smile-face.js)
// drops off it to below the card. The card then stays, back up, and scrolls
// away with the page; only once the pin is over does the smile grow the line
// (smile-line.js).
//
// The front face is the card artwork with its printed smile painted out,
// since the smile is drawn separately on top of it and leaves the card. At
// rest the two together look exactly like the picture in the page.
//
// The faces are unlit (MeshBasicMaterial), so they show the artwork's own
// colours, the same as the picture in the page.

import {
  BoxGeometry,
  CanvasTexture,
  Group,
  Mesh,
  MeshBasicMaterial,
  SRGBColorSpace,
  TextureLoader,
} from '../vendor/three.module.min.js';
import { easeInOut, pinProgress, screenBox, smoothstep, stickyTop } from './maths.js';
import { blobUrl } from '../blob-images.js';
import { cardFront, onCardFrontChange } from '../card-front.js';
import { CARD_HEIGHT, CARD_WIDTH, EYES, MOUTH, STROKE_HALF_WIDTH } from './smile-shape.js';

// The card's two faces. The front is the same file as the picture in the
// hero (the printed card, or the uwu one; see js/card-front.js), and
// blobUrl() fetches it once for both. The uwu front differs only in its
// word, so the smile is in the same place on both.
export const CARD_BACK = '/assets/12Ann%20Back.png';
const EDGE = '#f4f4f4';

// The hero's timeline, as fractions of its pinned scroll. The card has turned
// over, and the smile has landed below it, by TURN_END; the rest of the pin is
// a pause before the page moves on.
export const TURN_START = 0.04;
export const TURN_END = 0.72;

function loadImage(src) {
  return blobUrl(src).then((url) => new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = url;
  }));
}

// The front artwork with its smile painted out in the white of the disc it
// sits on: thick white strokes along the measured centrelines, wide enough to
// cover the printed stroke and its soft edge.
function frontWithoutSmile(image) {
  const canvas = document.createElement('canvas');
  canvas.width = CARD_WIDTH;
  canvas.height = CARD_HEIGHT;
  const context = canvas.getContext('2d');
  context.drawImage(image, 0, 0, CARD_WIDTH, CARD_HEIGHT);
  context.strokeStyle = '#ffffff';
  context.lineWidth = (STROKE_HALF_WIDTH + 8) * 2;
  context.lineCap = 'round';
  context.lineJoin = 'round';
  context.beginPath();
  MOUTH.forEach(([x, y], index) => (index ? context.lineTo(x, y) : context.moveTo(x, y)));
  context.stroke();
  for (const [[x1, y1], [x2, y2]] of EYES) {
    // The eye segments were measured a little short of the stroke's tips.
    const length = Math.hypot(x2 - x1, y2 - y1);
    const ux = (x2 - x1) / length;
    const uy = (y2 - y1) / length;
    context.beginPath();
    context.moveTo(x1 - ux * 6, y1 - uy * 6);
    context.lineTo(x2 + ux * 6, y2 + uy * 6);
    context.stroke();
  }
  return canvas;
}

export class NameCard {
  constructor(scene, renderer) {
    this.group = new Group();
    this.anchor = document.getElementById('cardAnchor');
    this.hero = document.getElementById('hello');
    this.stage = document.getElementById('heroStage');
    scene.add(this.group);

    const edge = new MeshBasicMaterial({ color: EDGE });
    // BoxGeometry's faces, in order: +x, -x, +y, -y, +z (front), -z (back).
    // The back face's texture reads the right way round from behind.
    this.front = new MeshBasicMaterial({ color: '#ffffff' });
    this.back = new MeshBasicMaterial({ color: '#ffffff' });
    this.mesh = new Mesh(new BoxGeometry(1, 1, 1), [edge, edge, edge, edge, this.front, this.back]);
    // Drawn first and never hiding anything: as the card turns, its near edge
    // swings forward past the smile, and the smile must stay in front. A box
    // with its back faces culled cannot overlap itself, so this is safe.
    this.mesh.renderOrder = -1;
    for (const material of [edge, this.front, this.back]) material.depthWrite = false;
    this.group.add(this.mesh);

    const anisotropy = renderer.capabilities.getMaxAnisotropy();
    const finish = (texture) => {
      texture.colorSpace = SRGBColorSpace;
      texture.anisotropy = anisotropy;
      return texture;
    };
    const frontTexture = (src) => loadImage(src).then((image) => finish(new CanvasTexture(frontWithoutSmile(image))));
    this.ready = Promise.all([
      frontTexture(cardFront()),
      blobUrl(CARD_BACK).then((url) => new TextureLoader().loadAsync(url)).then(finish),
    ]).then(([front, back]) => {
      this.front.map = front;
      this.back.map = back;
      this.front.needsUpdate = true;
      this.back.needsUpdate = true;
    });
    // A language change can swap the front (English (uwu) has its own).
    onCardFrontChange((src) => {
      Promise.all([frontTexture(src), this.ready]).then(([texture]) => {
        const old = this.front.map;
        this.front.map = texture;
        this.front.needsUpdate = true;
        if (old) old.dispose();
      }).catch((cause) => console.warn('card front not loaded:', cause));
    });

    this.turn = 0;
    this.progress = 0;
    this.size = null;
  }

  layout() {
    const rect = this.anchor.getBoundingClientRect();
    this.size = { width: rect.width, height: rect.height };
    this.thickness = Math.max(2, rect.width * 0.012);
    this.mesh.scale.set(rect.width, rect.height, this.thickness);
  }

  // How far through the hero's pin the page is, 0 to 1.
  // The hero's stage is pinned where it starts, below the official bar and
  // the header, not at the top of the screen; see pinHeroWhereItStarts() in
  // js/app.js.
  pin(view) {
    return pinProgress(this.hero, view, stickyTop(this.stage));
  }

  update(view) {
    if (!this.size) return;
    this.progress = this.pin(view);
    // 0 flat, 0.5 edge-on, 1 turned over.
    this.turn = easeInOut(smoothstep(TURN_START, TURN_END, this.progress));
    const swing = Math.sin(this.turn * Math.PI);

    // Over the anchor every frame: the stage is sticky, so it does not move
    // with the page while pinned.
    const box = screenBox(this.anchor, view);
    this.group.position.set(box.x, box.y, 0);

    // Turn over about the vertical axis, leaning and dipping back a little on
    // the way, and land flat on its back exactly where it started.
    this.mesh.rotation.set(swing * 0.3, this.turn * Math.PI, swing * -0.06);
    this.mesh.position.set(0, 0, -swing * this.size.width * 0.3 - this.thickness / 2);

    const rect = this.anchor.getBoundingClientRect();
    this.group.visible = rect.bottom > -view.height * 0.5 && rect.top < view.height * 1.5;
  }
}

