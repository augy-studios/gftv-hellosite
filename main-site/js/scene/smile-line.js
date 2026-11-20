// The smile line. One continuous stroke that grows out of the end of the
// smile's mouth (smile-face.js) once the hero's pin is over, with the card
// turned over and the smile sitting below it. It travels down the whole page
// weaving left and right and in and out of the screen, and comes home at the
// bottom as the same smile.
//
// It is built in page space (scene units are page pixels, see main.js), so it
// scrolls with the page like anything else in it. It draws itself as the page
// scrolls: its head stays a little below the middle of the screen (HEAD_AT),
// so the reader watches it grow, and it finishes the closing smile as the
// page reaches its end. Through the pinned chapters it runs out at the edges
// and far back, behind the photo ring and the bowl.
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
import { approach, clamp, lerp, smoothstep } from './maths.js';
import { EYES, MOUTH, STICKER, STROKE_HALF_WIDTH } from './smile-shape.js';
import { PaintSmudge } from './paint.js';

const RADIAL_SEGMENTS = 10;
// Where the head of the line sits, as a fraction of the screen's height from
// the top: below the middle, well clear of the bottom.
const HEAD_AT = 0.62;
// At least this many pixels of line per pixel of scroll once it starts.
const GROWTH = 2.5;
// The ending, in seconds from the moment the closing smile is whole: the
// smile turns from the soft tint to full strength between solidFrom and
// solidTo, the sticker fades in (CSS, .sticker-on) at sticker, and the line's
// tail catches up with it between closeFrom and closeTo, so that nothing of
// the line is left trailing out of the smile.
const FINISH = { solidFrom: 0.35, solidTo: 1.1, sticker: 1.4, closeFrom: 1.4, closeTo: 2.4, end: 2.4 };

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
    // The page's text colour, so the line reads in every theme and mode.
    this.material = new MeshBasicMaterial({ color: new Color() });
    this.group = new Group();
    scene.add(this.group);
    this.outroAnchor = document.getElementById('outroAnchor');

    const sphere = new SphereGeometry(1, 16, 12);
    this.startCap = new Mesh(sphere, this.material);
    this.headCap = new Mesh(sphere, this.material);
    this.group.add(this.startCap, this.headCap);

    this.tube = null;
    this.outroEyes = new Group();
    this.group.add(this.outroEyes);
    // The line smudges under the pointer like wet paint.
    this.paint = new PaintSmudge();

    this.head = 0;          // drawn segments, eased
    this.eyesIn = 0;        // the closing smile's eyes, 0 to 1
    this.finish = 0;        // seconds into the ending, run back when scrolled away
    this.stickerOn = false;
    this.soft = new Color();
    this.solid = new Color();
  }

  setTheme(theme) {
    this.soft.copy(theme.line);
    this.solid.copy(theme.text);
  }

  clear() {
    if (this.tube) {
      this.group.remove(this.tube);
      this.tube.geometry.dispose();
      this.tube = null;
    }
    for (const child of [...this.outroEyes.children]) {
      this.outroEyes.remove(child);
      child.geometry.dispose();
    }
  }

  // face: the smile (smile-face.js), already laid out. heroProgress: how far
  // through the hero's pin the page is.
  layout(view, face, heroProgress) {
    this.clear();
    if (!face.finalTail || !this.outroAnchor) return;

    const { width: vw, height: vh } = view;
    const toWorld = (x, y, z) => new Vector3(x - vw / 2, -y, z);

    // Where the smile's mouth ends once it sits below the card, and which way
    // it was heading: the line starts there, as thick as the smile's stroke.
    const heroRadius = face.radius;
    const tail = face.finalTail.clone();

    // The smile at the end, the same way round as on the card, drawn exactly
    // over the smile of the HelloSmile sticker that fills the closing
    // chapter's square, so the sticker can take over from it in place.
    const rect = this.outroAnchor.getBoundingClientRect();
    const square = Math.min(rect.width, rect.height);
    const toSquare = square / STICKER.size;
    const outroScale = STICKER.scale * toSquare;
    const outroRadius = Math.max(1.2, STROKE_HALF_WIDTH * outroScale);
    const left = rect.left + (rect.width - square) / 2;
    const top = rect.top + view.scrollY + (rect.height - square) / 2;
    const centreX = left + square / 2;
    const centreY = top + square / 2;
    const zOutro = outroRadius + 1;
    const onOutro = ([u, v]) => toWorld(
      left + (u * STICKER.scale + STICKER.x) * toSquare,
      top + (v * STICKER.scale + STICKER.y) * toSquare,
      zOutro,
    );
    // From the mouth's top right tip, round the bottom, to its lower left tip.
    const outroMouth = MOUTH.map(onOutro);

    // Between them, the line weaves down the page.
    // Off the end of the mouth the way it was heading, then down and to the
    // left into the weave. Every stretch keeps heading down the page, never
    // flat across it: the line is drawn as the page passes under it, so a flat
    // stretch would appear all at once.
    const points = [tail];
    points.push(tail.clone().addScaledVector(face.tailDirection, vh * 0.05));

    // The pinned chapters further down, which the line keeps clear of. The
    // hero's own pin is where it starts, so that one is left out.
    const pins = [...document.querySelectorAll('[data-pin]:not([data-pin="hero"])')].map((element) => {
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

    // In from above and to the right, onto the mouth's top right tip.
    const first = outroMouth[0];
    points.push(new Vector3(first.x + vw * 0.08, first.y + vh * 0.2, -vh * 0.05));
    points.push(new Vector3(first.x + square * 0.04, first.y + square * 0.12, zOutro));
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
    const heroEnd = 0.02;
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

    this.paint.reset(geometry, centres, segments, ring);

    this.tube = new Mesh(geometry, this.material);
    this.tube.frustumCulled = false;
    this.group.add(this.tube);

    // For each point along the line, the scroll position at which it appears
    // HEAD_AT down the screen. Perspective matters: a point far back in the
    // scene shows nearer the middle of the screen than its page position says,
    // so its depth is taken into account. Then, for each drawn length, the
    // latest of those so far, since the smiles double back on themselves and
    // the line must never be drawn past a point it has not yet reached.
    const below = (HEAD_AT - 0.5) * vh;
    const due = new Float32Array(segments + 1);
    let latest = -Infinity;
    for (let i = 0; i <= segments; i += 1) {
      const depth = (view.distance - centres[i].z) / view.distance;
      const scroll = -centres[i].y - below * depth - vh / 2;
      latest = Math.max(latest, scroll);
      due[i] = latest;
    }

    this.segments = segments;
    this.segmentLength = length / segments;
    this.centres = centres;
    this.radii = radii;
    this.due = due;
    // The scroll position at which the hero's pin ends and the line may start:
    // when the hero's bottom reaches the bottom of the screen.
    const hero = document.getElementById('hello');
    this.pinEnd = hero
      ? hero.getBoundingClientRect().top + view.scrollY + hero.offsetHeight - view.height
      : 0;

    // Where the closing smile's mouth begins along the line: the ring nearest
    // its top right tip. The tail stops there when it catches up.
    let mouthStart = segments;
    let nearest = Infinity;
    for (let i = Math.floor(segments * 0.5); i <= segments; i += 1) {
      const distance = centres[i].distanceToSquared(first);
      if (distance < nearest) { nearest = distance; mouthStart = i; }
    }
    this.mouthStart = mouthStart;

    this.startCap.position.copy(centres[0]);
    this.startCap.scale.setScalar(heroRadius);

    for (const [a, b] of EYES) this.outroEyes.add(eye(onOutro(a), onOutro(b), outroRadius, this.material));
    this.outroCentre = new Vector3(centreX - vw / 2, -centreY, zOutro);
    this.outroEyes.children.forEach((child) => { child.userData.home = child.position.clone(); });

    // Draw straight to where the page is, rather than replaying it.
    this.head = heroProgress >= 1 ? this.target(view) : 0;
  }

  // How many segments should be drawn for the current scroll position.
  //
  // The head of the line sits at HEAD_AT down the screen, so on a phone and
  // on a desktop alike the reader watches it being drawn rather than finding
  // it already there. Two things bend that rule:
  //
  //   - Near the bottom of the page the head is let further down, so that the
  //     closing smile is finished exactly as the page reaches its end. The
  //     smile sits low in the last screen, below where the head would be.
  //   - The line can never be longer than the scroll since the hero's pin
  //     ended, times a steady rate. So it starts from nothing and grows with
  //     the scroll, rather than appearing as a long line all at once.
  target(view) {
    if (!this.due) return 0;
    const since = view.scrollY - this.pinEnd;
    if (since <= 0) return 0;

    let scroll = view.scrollY;
    const short = this.due[this.segments] - view.maxScroll;
    if (short > 0) {
      scroll += short * smoothstep(view.maxScroll - view.height, view.maxScroll, view.scrollY);
    }
    if (view.scrollY >= view.maxScroll - 1) scroll = Infinity;

    // The last segment already due at this scroll position.
    let low = 0;
    let high = this.segments;
    while (low < high) {
      const middle = (low + high + 1) >> 1;
      if (this.due[middle] <= scroll) low = middle;
      else high = middle - 1;
    }

    // The growth rate: steady, but fast enough that the whole line can be
    // drawn by the time the page reaches its end.
    const room = Math.max(1, view.maxScroll - this.pinEnd);
    const rate = Math.max(GROWTH, (1.1 * this.segments * this.segmentLength) / room);
    const grown = Math.floor((since * rate) / this.segmentLength);
    return Math.min(low, grown);
  }

  // The last segment due by the given scroll position, so already above the
  // top of the screen by the end of the page, and no further than the start
  // of the closing smile's mouth.
  offTop(scroll) {
    let low = 0;
    let high = this.mouthStart;
    while (low < high) {
      const middle = (low + high + 1) >> 1;
      if (this.due[middle] <= scroll) low = middle;
      else high = middle - 1;
    }
    return low;
  }

  // heroProgress: how far through the hero's pin the page is, 0 to 1.
  update(view, seconds, heroProgress) {
    if (!this.tube) return;

    // Nothing is drawn while the hero is pinned: the line starts growing out
    // of the smile only once the card has turned over and the page moves on.
    // (Until then the smile is still on the pinned stage, not yet at the page
    // position the line starts from.) After that the head follows the scroll,
    // eased so it moves smoothly.
    let target = this.target(view);
    if (heroProgress < 1) target = 0;
    this.head = approach(this.head, target, 4, seconds);
    const drawn = Math.min(this.segments, Math.round(this.head));
    const complete = drawn >= this.segments - 1;

    // The ending's clock (see below), ahead of drawing, since the tail's
    // catching up depends on it.
    this.finish = clamp(this.finish + (complete ? seconds : -seconds), 0, FINISH.end);

    // Once the sticker is in, the tail of the line runs along it after the
    // head and stops at the start of the closing smile's mouth, so the line
    // closes itself off and only the smile is left. It starts from the last
    // stretch of line off the top of the screen, so the reader sees it come
    // in and catch up rather than waiting on line they cannot see.
    const close = smoothstep(FINISH.closeFrom, FINISH.closeTo, this.finish);
    let tail = 0;
    if (close > 0) {
      const from = this.offTop(view.maxScroll - view.height * 1.2);
      tail = Math.round(lerp(from, this.mouthStart, close));
    }
    tail = Math.min(tail, drawn);
    this.tube.geometry.setDrawRange(tail * RADIAL_SEGMENTS * 6, (drawn - tail) * RADIAL_SEGMENTS * 6);

    this.startCap.visible = drawn > tail;
    this.headCap.visible = drawn > tail;
    this.paint.update(view, seconds, drawn);
    const tailSmudge = this.paint.offset(tail);
    this.startCap.position.copy(this.centres[tail]);
    this.startCap.position.x += tailSmudge.x;
    this.startCap.position.y += tailSmudge.y;
    this.startCap.scale.setScalar(this.radii[tail]);
    const headIndex = complete ? this.segments : drawn;
    const smudge = this.paint.offset(headIndex);
    this.headCap.position.copy(this.centres[headIndex]);
    this.headCap.position.x += smudge.x;
    this.headCap.position.y += smudge.y;
    this.headCap.scale.setScalar(this.radii[headIndex]);

    // The closing smile's eyes arrive when the line has finished drawing it.
    this.eyesIn = approach(this.eyesIn, complete ? 1 : 0, 6, seconds);
    const pop = this.eyesIn;
    this.outroEyes.visible = pop > 0.01;
    for (const child of this.outroEyes.children) {
      child.scale.setScalar(Math.max(0.001, pop));
      child.position.copy(this.outroCentre).lerp(child.userData.home, pop);
    }

    // The ending, once the smile is whole: the eyes arrive, the smile fades
    // from the soft tint back to full strength, then the HelloSmile sticker
    // fades in over it, its smile exactly on this one. Scrolling back up runs
    // it backwards.
    const full = smoothstep(FINISH.solidFrom, FINISH.solidTo, this.finish);
    this.material.color.copy(this.soft).lerp(this.solid, full);
    const stickerOn = this.finish >= FINISH.sticker;
    if (stickerOn !== this.stickerOn) {
      this.stickerOn = stickerOn;
      this.outroAnchor?.classList.toggle('sticker-on', stickerOn);
    }
  }
}
