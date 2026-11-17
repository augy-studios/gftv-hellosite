// The name card, front and back, drawn exactly over the hero's card picture
// (#cardAnchor). At the top of the page it lies flat and still, so it looks
// like the picture it replaces. As the hero scrolls away it turns over to
// show its back and falls away into the page, leaving its smile behind: the
// smile is the start of the line (smile-line.js), which stays put.
//
// The faces are unlit (MeshBasicMaterial), so they show the artwork's own
// colours, the same as the picture in the page.

import {
  BoxGeometry,
  Group,
  Mesh,
  MeshBasicMaterial,
  SRGBColorSpace,
  TextureLoader,
} from '../vendor/three.module.min.js';
import { clamp, easeInOut } from './maths.js';

const FRONT = '/images/card-front.webp';
const BACK = '/images/card-back.webp';
const EDGE = '#f4f4f4';

function loadTexture(loader, url, maxAnisotropy) {
  return new Promise((resolve, reject) => {
    loader.load(url, (texture) => {
      texture.colorSpace = SRGBColorSpace;
      texture.anisotropy = maxAnisotropy;
      resolve(texture);
    }, undefined, reject);
  });
}

export class NameCard {
  constructor(scene, renderer) {
    this.group = new Group();
    this.anchor = document.getElementById('cardAnchor');
    this.hero = document.getElementById('hello');
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

    const loader = new TextureLoader();
    const anisotropy = renderer.capabilities.getMaxAnisotropy();
    this.ready = Promise.all([
      loadTexture(loader, FRONT, anisotropy),
      loadTexture(loader, BACK, anisotropy),
    ]).then(([front, back]) => {
      this.front.map = front;
      this.back.map = back;
      this.front.needsUpdate = true;
      this.back.needsUpdate = true;
    });

    this.box = null;
    this.turn = 0;
  }

  // The card's rectangle in page pixels, measured on every layout.
  layout(view) {
    const rect = this.anchor.getBoundingClientRect();
    const top = rect.top + view.scrollY;
    this.box = {
      left: rect.left,
      top,
      width: rect.width,
      height: rect.height,
    };
    const thickness = Math.max(2, rect.width * 0.012);
    this.thickness = thickness;
    this.mesh.scale.set(rect.width, rect.height, thickness);
    this.group.position.set(
      rect.left + rect.width / 2 - view.width / 2,
      -(top + rect.height / 2),
      0,
    );
    const heroRect = this.hero.getBoundingClientRect();
    this.heroBottom = heroRect.bottom + view.scrollY;
  }

  // How far the hero has scrolled away, 0 to 1: done by the time three
  // quarters of it has left the screen.
  progress(view) {
    if (!this.box) return 0;
    return clamp(view.scrollY / Math.max(1, this.heroBottom * 0.75), 0, 1);
  }

  update(view) {
    if (!this.box) return;
    const p = this.progress(view);
    const turn = easeInOut(clamp(p * 1.15, 0, 1));
    // 0 flat, 0.5 edge-on, 1 turned over. The line waits for edge-on.
    this.turn = turn;
    // Turn over about the vertical axis, lean back a little on the way, and
    // fall away from the reader so the smile is left in front of it.
    this.mesh.rotation.y = turn * Math.PI;
    this.mesh.rotation.x = Math.sin(turn * Math.PI) * 0.35;
    this.mesh.rotation.z = Math.sin(turn * Math.PI) * -0.08;
    this.mesh.position.z = -turn * this.box.width * 0.9 - this.thickness / 2;
    this.mesh.position.y = turn * this.box.height * 0.35;
    this.group.visible = view.scrollY < this.heroBottom + view.height;
  }
}
