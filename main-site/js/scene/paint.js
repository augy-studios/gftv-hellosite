// Wet paint: the smile line smudges under the pointer, inspired by lusion.co's
// ink and written for this line from scratch.
//
// Each ring of the line's tube carries a small sideways offset on a spring.
// Where the pointer passes near the line on screen, the line there is dragged
// along with it, like wet paint pushed by a finger, then springs back with a
// little wobble.
//
// Only the pointer moving smudges the line, never the page scrolling:
//   - a mouse counts its movement on the screen, so a mouse resting while the
//     page scrolls leaves the line alone;
//   - a finger counts its movement on the page, so a finger scrolling the page
//     (which moves with it) leaves the line alone, and a finger drawn across
//     the line smudges it.
//
// The offsets are in the plane of the screen, worked out through the same
// perspective the camera uses, so the line near the reader and the line far
// behind the page both move with the pointer by the same amount on screen.

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

export class PaintSmudge {
  constructor() {
    this.pointer = null;     // { x, y } on screen, and whether it is a touch
    this.previous = null;    // where it was last frame, on screen or on the page

    window.addEventListener('pointermove', (event) => {
      if (event.pointerType === 'touch') return;
      this.pointer = { x: event.clientX, y: event.clientY, touch: false };
    }, { passive: true });
    const touched = (event, fresh) => {
      const touch = event.touches[0];
      if (!touch) return;
      this.pointer = { x: touch.clientX, y: touch.clientY, touch: true };
      if (fresh) this.previous = null;
    };
    window.addEventListener('touchstart', (event) => touched(event, true), { passive: true });
    window.addEventListener('touchmove', (event) => touched(event, false), { passive: true });
    const leave = () => { this.pointer = null; this.previous = null; };
    window.addEventListener('touchend', leave, { passive: true });
    document.addEventListener('pointerleave', leave);
    window.addEventListener('blur', leave);
  }

  // A new line: its tube's vertices as built, and where its rings are.
  reset(geometry, centres, segments, ringSize) {
    this.positions = geometry.attributes.position;
    this.base = this.positions.array.slice();
    this.centres = centres;
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
  stroke(a, b, view, drawn) {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const length2 = dx * dx + dy * dy;
    if (length2 < 0.25 || length2 > view.height * view.height) return;

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
    }
  }

  update(view, seconds, drawn) {
    if (!this.base || seconds <= 0) return;

    // The pointer's path this frame, measured so that scrolling alone moves
    // nothing: on screen for a mouse, on the page for a finger.
    if (this.pointer) {
      const touch = this.pointer.touch;
      const here = { x: this.pointer.x, y: this.pointer.y + (touch ? view.scrollY : 0), touch };
      if (this.previous && this.previous.touch === touch) {
        const shift = touch ? view.scrollY : 0;
        this.stroke(
          { x: this.previous.x, y: this.previous.y - shift },
          { x: here.x, y: here.y - shift },
          view,
          drawn,
        );
      }
      this.previous = here;
    }

    this.settle(seconds);
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

  // Where ring i has been dragged to, for the cap on the line's head.
  offset(i) {
    return this.ox ? { x: this.ox[i], y: this.oy[i] } : { x: 0, y: 0 };
  }
}
