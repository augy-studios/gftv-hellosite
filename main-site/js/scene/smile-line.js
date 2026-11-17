// The smile line. One continuous stroke that begins as the name card's smile
// at the top of the page, leaves the card as it turns over, travels down the
// whole page weaving left and right and in and out of the screen, and comes
// home at the bottom as the same smile, mirrored left to right.
//
// It is built in page space (scene units are page pixels, see main.js), so it
// scrolls with the page like anything else in it. It draws itself as the page
// scrolls: the drawn part always reaches a little below the bottom of the
// screen, so the reader watches it arrive. Through the pinned chapters it
// runs out at the edges and far back, behind the photo ring and the bowl.
//
// Rebuilt on every layout change (resize, fonts, the photo list arriving),
// since it is laid along the page's own geometry.

import {
  CapsuleGeometry,
  CatmullRomCurve3,
  Color,
  Group,
  Mesh,
  MeshBasicMaterial,
  SphereGeometry,
  TubeGeometry,
  Vector3,
} from '../vendor/three.module.min.js';
import { CARD_INK } from './colours.js';
import { approach, clamp, lerp, smoothstep } from './maths.js';
import { CARD_WIDTH, EYES, FACE_BOX, MOUTH, STROKE_HALF_WIDTH } from './smile-shape.js';

const RADIAL_SEGMENTS = 10;
// How far below the bottom of the screen the drawn line reaches.
const LEAD = 0.12;

function polylineLength(points) {
  let total = 0;
  for (let i = 1; i < points.length; i += 1) total += points[i].distanceTo(points[i - 1]);
  return total;
}

// A capsule from a to b: one eye.
function eye(a, b, radius, material) {
  const length = a.distanceTo(b);
  const mesh = new Mesh(new CapsuleGeometry(radius, length, 6, 14), material);
  mesh.position.copy(a).add(b).multiplyScalar(0.5);
  mesh.quaternion.setFromUnitVectors(new Vector3(0, 1, 0), b.clone().sub(a).normalize());
  return mesh;
}

export class SmileLine {
  constructor(scene) {
    this.material = new MeshBasicMaterial({ color: CARD_INK.clone() });
    this.group = new Group();
    scene.add(this.group);
    this.outroAnchor = document.getElementById('outroAnchor');

    const sphere = new SphereGeometry(1, 16, 12);
    this.startCap = new Mesh(sphere, this.material);
    this.headCap = new Mesh(sphere, this.material);
    this.group.add(this.startCap, this.headCap);

    this.tube = null;
    this.heroEyes = new Group();
    this.outroEyes = new Group();
    this.group.add(this.heroEyes, this.outroEyes);

    this.head = 0;          // drawn segments, eased
    this.eyesIn = 0;        // the closing smile's eyes, 0 to 1
    this.textColour = new Color();
  }

  setTheme(theme) {
    this.textColour.copy(theme.text);
  }

  clear() {
    if (this.tube) {
      this.group.remove(this.tube);
      this.tube.geometry.dispose();
      this.tube = null;
    }
    for (const eyes of [this.heroEyes, this.outroEyes]) {
      for (const child of [...eyes.children]) {
        eyes.remove(child);
        child.geometry.dispose();
      }
    }
  }

  layout(view, card) {
    this.clear();
    if (!card.box || !this.outroAnchor) return;

    const { width: vw, height: vh } = view;
    const toWorld = (x, y, z) => new Vector3(x - vw / 2, -y, z);

    // The smile on the card, over the printed one.
    const cardScale = card.box.width / CARD_WIDTH;
    const heroRadius = Math.max(1.2, STROKE_HALF_WIDTH * cardScale);
    const zCard = heroRadius + 1;
    const onCard = ([u, v]) => toWorld(card.box.left + u * cardScale, card.box.top + v * cardScale, zCard);
    const heroMouth = MOUTH.map(onCard);

    // The smile at the end, mirrored, fitted into the closing chapter's square.
    const rect = this.outroAnchor.getBoundingClientRect();
    const square = Math.min(rect.width, rect.height);
    const faceWidth = FACE_BOX.right - FACE_BOX.left;
    const faceHeight = FACE_BOX.bottom - FACE_BOX.top;
    const outroScale = (square * 0.86) / Math.max(faceWidth, faceHeight);
    const outroRadius = Math.max(1.2, STROKE_HALF_WIDTH * outroScale);
    const centreX = rect.left + rect.width / 2;
    const centreY = rect.top + view.scrollY + rect.height / 2;
    const faceX = (FACE_BOX.left + FACE_BOX.right) / 2;
    const faceY = (FACE_BOX.top + FACE_BOX.bottom) / 2;
    const zOutro = outroRadius + 1;
    const mirrored = ([u, v]) => toWorld(
      centreX - (u - faceX) * outroScale,
      centreY + (v - faceY) * outroScale,
      zOutro,
    );
    const outroMouth = MOUTH.map(mirrored);

    // Between them, the line weaves down the page.
    const points = [...heroMouth];
    const tail = heroMouth[heroMouth.length - 1];
    const before = heroMouth[heroMouth.length - 4];
    const away = tail.clone().sub(before).normalize();
    points.push(tail.clone().addScaledVector(away, vh * 0.05));
    // Out to the left edge at the card's height before heading down, so the
    // line does not cut through the headline under the card.
    points.push(new Vector3(-vw * 0.47, tail.y - vh * 0.04, -vh * 0.05));

    const pins = [...document.querySelectorAll('[data-pin]')].map((element) => {
      const box = element.getBoundingClientRect();
      return { top: box.top + view.scrollY, bottom: box.bottom + view.scrollY };
    });

    const startY = -tail.y + vh * 0.5;
    const endY = -outroMouth[0].y - vh * 0.45;
    const step = vh * 0.55;
    const count = Math.max(2, Math.ceil((endY - startY) / step));
    for (let k = 0; k <= count; k += 1) {
      const pageY = lerp(startY, endY, k / count);
      const side = k % 2 === 0 ? -1 : 1;
      const pinned = pins.some((pin) => pageY > pin.top - vh * 0.25 && pageY < pin.bottom + vh * 0.1);
      const x = pinned
        ? side * vw * 0.55
        : side * vw * (0.26 + 0.1 * Math.sin(k * 1.7));
      const z = pinned
        ? -vh * 1.9
        : lerp(-vh * 0.75, vh * 0.28, (Math.sin(k * 1.13 + 0.6) + 1) / 2);
      points.push(new Vector3(x, -pageY, z));
    }

    const first = outroMouth[0];
    points.push(new Vector3(first.x - vw * 0.08, first.y + vh * 0.2, -vh * 0.05));
    points.push(new Vector3(first.x - square * 0.06, first.y + square * 0.12, zOutro));
    points.push(...outroMouth);

    const curve = new CatmullRomCurve3(points, false, 'centripetal');
    // Three's default of 200 is far too coarse for a path a page long: the
    // segments would come out uneven, bunched on the smiles.
    curve.arcLengthDivisions = Math.max(4000, points.length * 40);
    const length = curve.getLength();
    const segments = clamp(Math.round(length / 5), 600, 6000);

    // A tube of radius 1, then each ring scaled to the radius it should have
    // at that point: the card's stroke at the start, the closing smile's at
    // the end, blending between them along the way.
    const geometry = new TubeGeometry(curve, segments, 1, RADIAL_SEGMENTS, false);
    const heroEnd = polylineLength(heroMouth) / length;
    const outroStart = 1 - polylineLength(outroMouth) / length;
    const positions = geometry.attributes.position;
    const centres = [];
    const radii = [];
    const ring = RADIAL_SEGMENTS + 1;
    for (let i = 0; i <= segments; i += 1) {
      const t = i / segments;
      const centre = curve.getPointAt(t);
      const radius = lerp(heroRadius, outroRadius, smoothstep(heroEnd, outroStart, t));
      centres.push(centre);
      radii.push(radius);
      for (let j = 0; j < ring; j += 1) {
        const index = i * ring + j;
        positions.setXYZ(
          index,
          centre.x + (positions.getX(index) - centre.x) * radius,
          centre.y + (positions.getY(index) - centre.y) * radius,
          centre.z + (positions.getZ(index) - centre.z) * radius,
        );
      }
    }
    positions.needsUpdate = true;
    geometry.computeBoundingSphere();

    this.tube = new Mesh(geometry, this.material);
    this.tube.frustumCulled = false;
    this.group.add(this.tube);

    // For each drawn length, the lowest point on the page the line has reached
    // so far: the smiles double back on themselves, so the page position is
    // not simply increasing along the line.
    const reach = new Float32Array(segments + 1);
    let lowest = -Infinity;
    for (let i = 0; i <= segments; i += 1) {
      lowest = Math.max(lowest, -centres[i].y);
      reach[i] = lowest;
    }

    this.segments = segments;
    this.heroEndIndex = Math.round(heroEnd * segments);
    this.centres = centres;
    this.radii = radii;
    this.reach = reach;

    this.startCap.position.copy(centres[0]);
    this.startCap.scale.setScalar(heroRadius);

    for (const [a, b] of EYES) this.heroEyes.add(eye(onCard(a), onCard(b), heroRadius, this.material));
    for (const [a, b] of EYES) this.outroEyes.add(eye(mirrored(a), mirrored(b), outroRadius, this.material));
    this.outroCentre = new Vector3(centreX - vw / 2, -centreY, zOutro);
    this.outroEyes.children.forEach((child) => { child.userData.home = child.position.clone(); });

    // Draw straight to where the page is, rather than replaying it.
    this.head = view.scrollY > 0 ? this.target(view) : this.heroEndIndex;
  }

  // How many segments should be drawn for the current scroll position.
  target(view) {
    if (!this.reach) return 0;
    const atBottom = view.scrollY >= view.maxScroll - 2;
    if (atBottom) return this.segments;
    const limit = view.scrollY + view.height * (1 + LEAD);
    // The last segment whose reach is above the limit.
    let low = 0;
    let high = this.segments;
    while (low < high) {
      const middle = (low + high + 1) >> 1;
      if (this.reach[middle] <= limit) low = middle;
      else high = middle - 1;
    }
    return low;
  }

  // cardProgress: how far the hero has scrolled away, 0 to 1.
  // cardTurn: how far the card has turned over, 0 flat, 0.5 edge-on, 1 over.
  update(view, seconds, cardProgress, cardTurn) {
    if (!this.tube) return;

    // Eased, but never slower than a steady minimum, so a jump to the end of
    // the page finishes the drawing in a moment rather than creeping in.
    // Until the card has turned edge-on, the line is only its smile: it grows
    // out of the smile once the card's face is out of the way, never across it.
    let target = this.target(view);
    if (cardTurn < 0.5) target = Math.min(target, this.heroEndIndex);
    const eased = approach(this.head, target, 5, seconds);
    const minimum = Math.min(Math.abs(target - this.head), this.segments * 0.6 * seconds);
    this.head = Math.abs(eased - this.head) >= minimum
      ? eased
      : this.head + Math.sign(target - this.head) * minimum;
    const drawn = Math.min(this.segments, Math.round(this.head));
    this.tube.geometry.setDrawRange(0, drawn * RADIAL_SEGMENTS * 6);

    const complete = drawn >= this.segments - 1;
    this.headCap.visible = drawn > 0;
    const headIndex = complete ? this.segments : drawn;
    this.headCap.position.copy(this.centres[headIndex]);
    this.headCap.scale.setScalar(this.radii[headIndex]);

    // The closing smile's eyes arrive when the line has finished drawing it.
    this.eyesIn = approach(this.eyesIn, complete ? 1 : 0, 6, seconds);
    const pop = this.eyesIn;
    this.outroEyes.visible = pop > 0.01;
    for (const child of this.outroEyes.children) {
      child.scale.setScalar(Math.max(0.001, pop));
      child.position.copy(this.outroCentre).lerp(child.userData.home, pop);
    }

    // Printed-card ink while the smile sits on the card; the page's text
    // colour once it has left it, so it reads in dark mode too.
    this.material.color.copy(CARD_INK).lerp(this.textColour, smoothstep(0.05, 0.45, cardProgress));
  }
}
