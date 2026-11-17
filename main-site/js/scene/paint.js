// Wet paint: the smile line smudges and splashes under the pointer, inspired
// by lusion.co's ink and written for this line from scratch.
//
//   - Smudge. Each ring of the line's tube carries a small sideways offset on
//     a spring. Where the pointer passes near the line on screen, the line
//     there is dragged along with it, like wet paint pushed by a finger, then
//     springs back with a little wobble. A pointer resting while the page
//     scrolls brushes the line as it goes by. A finger scrolling the page does
//     not, since the page moves with the finger.
//   - Splash. A quick flick across the line throws off droplets in the line's
//     colour, which fly out, fall a little and shrink away.
//   - A fast scroll makes the visible line ripple and flick off a droplet or
//     two.
//
// The offsets are in the plane of the screen, worked out through the same
// perspective the camera uses, so the line near the reader and the line far
// behind the page both move with the pointer by the same amount on screen.

import { InstancedMesh, Object3D, SphereGeometry } from '../vendor/three.module.min.js';

// How near the pointer has to pass, on screen, to move the line.
const REACH = 48;
// How much of the pointer's movement the paint takes up, and how much more
// it is kicked into its wobble.
const DRAG = 0.5;
const KICK = 7;
// The spring that brings the line back: stiffness and damping, per second.
const SPRING = 70;
const DAMPING = 8;
// The furthest the paint can be dragged, on screen.
const FURTHEST = 70;
// A flick this fast (screen pixels a second) across the line splashes.
const SPLASH_SPEED = 1100;
// The fastest a droplet is thrown, in screen pixels a second.
const THROW = 800;
// A scroll this fast (pixels a second) ripples the line.
const RIPPLE_SPEED = 2600;
const DROPS = 96;

export class PaintSmudge {
  constructor(group, material) {
    this.pointer = null;     // the pointer on screen, in client pixels
    this.previous = null;    // where it was on the page last frame
    this.lastScroll = null;
    this.time = 0;

    this.drops = new InstancedMesh(new SphereGeometry(1, 10, 8), material, DROPS);
    this.drops.count = 0;
    this.drops.frustumCulled = false;
    group.add(this.drops);
    this.live = [];
    this.place = new Object3D();

    const move = (x, y) => { this.pointer = { x, y }; };
    window.addEventListener('pointermove', (event) => {
      if (event.pointerType !== 'touch') move(event.clientX, event.clientY);
    }, { passive: true });
    window.addEventListener('touchstart', (event) => {
      const touch = event.touches[0];
      if (touch) { move(touch.clientX, touch.clientY); this.previous = null; }
    }, { passive: true });
    window.addEventListener('touchmove', (event) => {
      const touch = event.touches[0];
      if (touch) move(touch.clientX, touch.clientY);
    }, { passive: true });
    const leave = () => { this.pointer = null; this.previous = null; };
    window.addEventListener('touchend', leave, { passive: true });
    document.addEventListener('pointerleave', leave);
    window.addEventListener('blur', leave);
  }

  // A new line: its tube's vertices as built, and where its rings are.
  reset(geometry, centres, radii, segments, ringSize) {
    this.geometry = geometry;
    this.positions = geometry.attributes.position;
    this.base = this.positions.array.slice();
    this.centres = centres;
    this.radii = radii;
    this.segments = segments;
    this.ringSize = ringSize;
    this.ox = new Float32Array(segments + 1);
    this.oy = new Float32Array(segments + 1);
    this.vx = new Float32Array(segments + 1);
    this.vy = new Float32Array(segments + 1);
    this.low = Infinity;     // the stretch of rings currently moving
    this.high = -Infinity;
    this.previous = null;
  }

  // Where ring i is on screen, and how many scene units one screen pixel is
  // there.
  screen(i, view) {
    const centre = this.centres[i];
    const depth = view.distance / (view.distance - centre.z);
    const cameraY = -(view.scrollY + view.height / 2);
    return {
      x: (centre.x + this.ox[i]) * depth + view.width / 2,
      y: view.height / 2 - (centre.y + this.oy[i] - cameraY) * depth,
      unit: 1 / depth,
    };
  }

  // Drag the line where the pointer went, from a to b on screen.
  stroke(a, b, view, drawn, seconds) {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const length2 = dx * dx + dy * dy;
    if (length2 < 0.25 || length2 > view.height * view.height) return;
    const speed = Math.sqrt(length2) / Math.max(seconds, 1 / 240);
    let nearest = -1;
    let nearestDistance = Infinity;

    for (let i = 0; i <= drawn; i += 1) {
      const point = this.screen(i, view);
      if (point.y < -REACH || point.y > view.height + REACH) continue;
      // Distance from the ring to the pointer's path this frame.
      const t = Math.max(0, Math.min(1, ((point.x - a.x) * dx + (point.y - a.y) * dy) / length2));
      const ex = point.x - (a.x + dx * t);
      const ey = point.y - (a.y + dy * t);
      const distance = Math.hypot(ex, ey);
      if (distance > REACH) continue;
      const fall = (1 - distance / REACH) ** 2;
      // Screen pixels to scene units at this ring's depth; screen y is down.
      const pullX = dx * point.unit * fall;
      const pullY = -dy * point.unit * fall;
      this.ox[i] += pullX * DRAG;
      this.oy[i] += pullY * DRAG;
      this.vx[i] += pullX * KICK;
      this.vy[i] += pullY * KICK;
      // Never further than FURTHEST on screen.
      const limit = FURTHEST * point.unit;
      const size = Math.hypot(this.ox[i], this.oy[i]);
      if (size > limit) {
        this.ox[i] *= limit / size;
        this.oy[i] *= limit / size;
      }
      this.low = Math.min(this.low, i);
      this.high = Math.max(this.high, i);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearest = i;
      }
    }

    if (nearest >= 0 && speed > SPLASH_SPEED) {
      const unit = this.screen(nearest, view).unit;
      const count = Math.min(10, Math.round(speed / 500));
      // Thrown no faster than THROW on screen, however fast the flick, or
      // the drops would be off the screen before they were seen.
      const throwSpeed = Math.min(speed, THROW);
      for (let n = 0; n < count; n += 1) {
        this.splash(nearest, (dx / Math.sqrt(length2)) * throwSpeed * unit, (-dy / Math.sqrt(length2)) * throwSpeed * unit, unit);
      }
    }
  }

  // One droplet from ring i, thrown roughly along (vx, vy). `unit` is how
  // many scene units a screen pixel is there: droplets are sized on screen,
  // so they show even where the line runs far back and looks thin.
  splash(i, vx, vy, unit) {
    if (this.live.length >= DROPS) this.live.shift();
    const centre = this.centres[i];
    const spread = Math.hypot(vx, vy) * 0.35;
    const life = 0.55 + Math.random() * 0.5;
    this.live.push({
      x: centre.x + this.ox[i],
      y: centre.y + this.oy[i],
      z: centre.z,
      vx: vx * (0.25 + Math.random() * 0.4) + (Math.random() - 0.5) * spread,
      vy: vy * (0.25 + Math.random() * 0.4) + (Math.random() - 0.5) * spread,
      size: Math.max(this.radii[i] * (0.9 + Math.random() * 1.3), (3.5 + Math.random() * 5) * unit),
      life,
      full: life,
    });
  }

  // A fast scroll: the line on screen ripples, and now and then flicks off a
  // droplet.
  ripple(view, velocity, drawn) {
    const strength = Math.min(1, (Math.abs(velocity) - RIPPLE_SPEED) / 4000);
    if (strength <= 0) return;
    let first = Infinity;
    let last = -Infinity;
    for (let i = 0; i <= drawn; i += 3) {
      const point = this.screen(i, view);
      if (point.y < 0 || point.y > view.height) continue;
      const push = Math.sin(i * 0.19 + this.time * 11) * strength * 260 * point.unit;
      for (let k = i; k < Math.min(i + 3, drawn + 1); k += 1) this.vx[k] += push;
      first = Math.min(first, i);
      last = Math.max(last, Math.min(i + 2, drawn));
    }
    if (first <= last) {
      this.low = Math.min(this.low, first);
      this.high = Math.max(this.high, last);
      if (Math.random() < strength * 0.5) {
        const i = first + Math.floor(Math.random() * (last - first + 1));
        const unit = this.screen(i, view).unit;
        this.splash(i, (Math.random() - 0.5) * 900 * unit, Math.sign(velocity) * 500 * unit, unit);
      }
    }
  }

  update(view, seconds, drawn) {
    if (!this.base || seconds <= 0) return;
    this.time += seconds;

    // The pointer's path on the page this frame. Kept in page terms, so a
    // pointer resting while the page scrolls still brushes the line, and a
    // finger moving with the page does not.
    if (this.pointer) {
      const page = { x: this.pointer.x, y: this.pointer.y + view.scrollY };
      if (this.previous) {
        const a = { x: this.previous.x, y: this.previous.y - view.scrollY };
        const b = { x: page.x, y: page.y - view.scrollY };
        this.stroke(a, b, view, drawn, seconds);
      }
      this.previous = page;
    }

    if (this.lastScroll !== null) {
      this.ripple(view, (view.scrollY - this.lastScroll) / seconds, drawn);
    }
    this.lastScroll = view.scrollY;

    this.settle(seconds);
    this.moveDrops(seconds);
  }

  // The springs, over the stretch of rings that is moving, and the tube's
  // vertices moved with them.
  settle(seconds) {
    if (this.low > this.high) return;
    const step = Math.min(seconds, 1 / 30);
    const array = this.positions.array;
    let low = Infinity;
    let high = -Infinity;
    for (let i = this.low; i <= this.high; i += 1) {
      this.vx[i] += (-SPRING * this.ox[i] - DAMPING * this.vx[i]) * step;
      this.vy[i] += (-SPRING * this.oy[i] - DAMPING * this.vy[i]) * step;
      this.ox[i] += this.vx[i] * step;
      this.oy[i] += this.vy[i] * step;
      const still = Math.abs(this.ox[i]) + Math.abs(this.oy[i]) < 0.02
        && Math.abs(this.vx[i]) + Math.abs(this.vy[i]) < 0.05;
      if (still) {
        this.ox[i] = 0;
        this.oy[i] = 0;
        this.vx[i] = 0;
        this.vy[i] = 0;
      } else {
        low = Math.min(low, i);
        high = Math.max(high, i);
      }
      for (let j = 0; j < this.ringSize; j += 1) {
        const index = (i * this.ringSize + j) * 3;
        array[index] = this.base[index] + this.ox[i];
        array[index + 1] = this.base[index + 1] + this.oy[i];
      }
    }
    // Only the stretch that changed goes to the graphics card.
    this.positions.clearUpdateRanges();
    this.positions.addUpdateRange(this.low * this.ringSize * 3, (this.high - this.low + 1) * this.ringSize * 3);
    this.positions.needsUpdate = true;
    this.low = low;
    this.high = high;
  }

  moveDrops(seconds) {
    const place = this.place;
    let count = 0;
    this.live = this.live.filter((drop) => {
      drop.life -= seconds;
      if (drop.life <= 0) return false;
      const drag = Math.exp(-5 * seconds);
      drop.vx *= drag;
      drop.vy = drop.vy * drag - 600 * seconds;
      drop.x += drop.vx * seconds;
      drop.y += drop.vy * seconds;
      place.position.set(drop.x, drop.y, drop.z);
      place.scale.setScalar(drop.size * Math.sqrt(drop.life / drop.full));
      place.updateMatrix();
      this.drops.setMatrixAt(count, place.matrix);
      count += 1;
      return true;
    });
    this.drops.count = count;
    if (count > 0) this.drops.instanceMatrix.needsUpdate = true;
  }

  // Where ring i has been dragged to, for the caps that sit on the line.
  offset(i) {
    return this.ox ? { x: this.ox[i], y: this.oy[i] } : { x: 0, y: 0 };
  }
}
