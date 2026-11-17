// "Takagi when?" A bowl of ramen in the middle of the Takagi chapter's sticky
// stage, drawn over #bowlAnchor. Over the chapter's scroll it turns, tips
// towards the reader so they can see in, and in the last stretch the bowl is
// eaten: the toppings and noodles go and the broth drops. The captions beside
// it change at the same points ("Takagi when?", "Takagi now.", "Takagi
// eaten.").
//
// Built from simple shapes rather than a model file, so there is nothing
// extra to download, and toon shaded with three flat steps so it sits with
// the flat GFTV look rather than looking like a photo.

import {
  CanvasTexture,
  CircleGeometry,
  CylinderGeometry,
  DataTexture,
  DoubleSide,
  Group,
  InstancedMesh,
  LatheGeometry,
  Matrix4,
  Mesh,
  MeshToonMaterial,
  NearestFilter,
  Object3D,
  PlaneGeometry,
  RedFormat,
  RepeatWrapping,
  SRGBColorSpace,
  SphereGeometry,
  TorusGeometry,
  TubeGeometry,
  CatmullRomCurve3,
  Vector2,
  Vector3,
  BackSide,
} from '../vendor/three.module.min.js';
import { RAMEN } from './colours.js';
import { approach, clamp, lerp, pinProgress, screenBox, smoothstep } from './maths.js';

// Where the captions change, as fractions of the chapter's scroll.
const STEPS = [0, 0.36, 0.68];

// Three flat light steps for every toon material.
function toonSteps() {
  const data = new Uint8Array([90, 180, 255]);
  const texture = new DataTexture(data, 3, 1, RedFormat);
  texture.minFilter = NearestFilter;
  texture.magFilter = NearestFilter;
  texture.needsUpdate = true;
  return texture;
}

// The red band inside the rim, with a black spiral key pattern: the classic
// ramen bowl border.
function rimPattern() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 64;
  const c = canvas.getContext('2d');
  c.fillStyle = RAMEN.rimRed;
  c.fillRect(0, 0, 256, 64);
  c.strokeStyle = RAMEN.rimInk;
  c.lineWidth = 5;
  c.lineCap = 'square';
  // Two square spirals per tile, joined.
  for (let i = 0; i < 2; i += 1) {
    const x = i * 128 + 14;
    c.beginPath();
    c.moveTo(x, 50);
    c.lineTo(x, 14);
    c.lineTo(x + 46, 14);
    c.lineTo(x + 46, 42);
    c.lineTo(x + 20, 42);
    c.lineTo(x + 20, 26);
    c.lineTo(x + 32, 26);
    c.moveTo(x + 46, 50);
    c.lineTo(x + 100, 50);
    c.lineTo(x + 100, 14);
    c.lineTo(x + 70, 14);
    c.lineTo(x + 70, 34);
    c.lineTo(x + 86, 34);
    c.stroke();
  }
  c.fillStyle = RAMEN.rimInk;
  c.fillRect(0, 0, 256, 5);
  c.fillRect(0, 59, 256, 5);
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.wrapS = RepeatWrapping;
  texture.repeat.set(10, 1);
  return texture;
}

// A seeded random, so the toppings land in the same places on every visit.
function seeded(seed) {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

export class RamenBowl {
  constructor(scene) {
    this.section = document.getElementById('takagi');
    this.anchor = document.getElementById('bowlAnchor');
    this.stage = this.section?.querySelector('.stage');
    this.steps = [...(this.section?.querySelectorAll('.takagi-step') ?? [])];
    this.group = new Group();
    this.bowl = new Group();
    this.group.add(this.bowl);
    scene.add(this.group);

    const steps = toonSteps();
    const toon = (color, extra = {}) => new MeshToonMaterial({ color, gradientMap: steps, ...extra });

    // The bowl: a lathe profile, out from the foot, up to the rim, back down
    // the inside. Unit radius at the rim.
    const profile = [
      [0.0, -0.6], [0.36, -0.6], [0.4, -0.66], [0.47, -0.66], [0.5, -0.58],
      [0.66, -0.5], [0.82, -0.36], [0.94, -0.18], [1.0, 0.0], [1.0, 0.03],
      [0.95, 0.03], [0.93, -0.02], [0.87, -0.2], [0.74, -0.37], [0.56, -0.48],
      [0.3, -0.53], [0.0, -0.54],
    ].map(([x, y]) => new Vector2(x, y));
    const bowl = new Mesh(new LatheGeometry(profile, 96), toon(RAMEN.bowl));
    this.bowl.add(bowl);

    // The patterned band just inside the rim, seen from inside the bowl.
    const band = new Mesh(
      new CylinderGeometry(0.938, 0.885, 0.17, 96, 1, true),
      toon('#ffffff', { map: rimPattern(), side: BackSide }),
    );
    band.position.y = -0.075;
    this.bowl.add(band);

    // The broth, and everything that gets eaten.
    this.broth = new Mesh(new CircleGeometry(0.86, 64), toon(RAMEN.broth));
    this.broth.rotation.x = -Math.PI / 2;
    this.broth.position.y = -0.12;
    this.bowl.add(this.broth);

    this.food = new Group();
    this.food.position.y = -0.115;
    this.bowl.add(this.food);
    const random = seeded(12);

    // Noodles: wavy strands across the front half.
    const noodle = toon(RAMEN.noodle);
    for (let i = 0; i < 18; i += 1) {
      const startX = lerp(-0.62, 0.5, random());
      const startZ = lerp(-0.05, 0.62, random());
      const points = [];
      for (let k = 0; k < 7; k += 1) {
        points.push(new Vector3(
          startX + k * 0.05 + Math.sin(k * 1.6 + i) * 0.035,
          0.01 + Math.sin(k * 2.1 + i) * 0.012,
          startZ + Math.cos(k * 1.3 + i * 0.7) * 0.06 - k * 0.012,
        ));
      }
      this.food.add(new Mesh(new TubeGeometry(new CatmullRomCurve3(points), 24, 0.018, 6), noodle));
    }

    // Two slices of pork, overlapping, leaning on the back of the bowl.
    for (let i = 0; i < 2; i += 1) {
      const slice = new Mesh(new CylinderGeometry(0.27, 0.27, 0.05, 40), [
        toon(RAMEN.porkEdge), toon(RAMEN.pork), toon(RAMEN.pork),
      ]);
      slice.position.set(-0.28 + i * 0.26, 0.05 + i * 0.03, -0.38 + i * 0.05);
      slice.rotation.set(0.45, 0.2 * i, -0.15 + i * 0.25);
      this.food.add(slice);
    }

    // Half an egg, cut face up: a white dome underneath, the flat white face,
    // and the yolk on it.
    const egg = new Group();
    const eggWhite = toon(RAMEN.egg);
    const dome = new Mesh(new SphereGeometry(0.16, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), eggWhite);
    dome.rotation.x = Math.PI;
    dome.scale.set(1, 0.8, 1.3);
    const face = new Mesh(new CircleGeometry(0.16, 32), eggWhite);
    face.rotation.x = -Math.PI / 2;
    face.scale.set(1, 1.3, 1);
    const yolk = new Mesh(new CircleGeometry(0.085, 32), toon(RAMEN.yolk));
    yolk.rotation.x = -Math.PI / 2;
    yolk.scale.set(1, 1.2, 1);
    yolk.position.y = 0.003;
    egg.add(dome, face, yolk);
    egg.rotation.set(-0.35, 0.4, 0);
    egg.position.set(0.42, 0.04, -0.12);
    this.food.add(egg);

    // Nori, standing up at the back.
    const nori = new Mesh(new PlaneGeometry(0.42, 0.5), toon(RAMEN.nori, { side: DoubleSide }));
    nori.position.set(0.24, 0.2, -0.6);
    nori.rotation.set(-0.25, -0.35, 0.08);
    this.food.add(nori);

    // Corn, a heap to one side.
    const place = new Object3D();
    const matrix = new Matrix4();
    const corn = new InstancedMesh(new SphereGeometry(0.035, 10, 8), toon(RAMEN.corn), 70);
    for (let i = 0; i < 70; i += 1) {
      const angle = random() * Math.PI * 2;
      const distance = Math.sqrt(random()) * 0.2;
      place.position.set(-0.36 + Math.cos(angle) * distance, 0.02 + (0.2 - distance) * 0.25 + random() * 0.02, 0.32 + Math.sin(angle) * distance);
      place.scale.set(1, 0.85, 0.9);
      place.updateMatrix();
      corn.setMatrixAt(i, place.matrix);
    }
    this.food.add(corn);

    // Spring onion rings, scattered.
    const onion = new InstancedMesh(new TorusGeometry(0.03, 0.011, 6, 14), toon(RAMEN.onion), 26);
    for (let i = 0; i < 26; i += 1) {
      const angle = random() * Math.PI * 2;
      const distance = 0.15 + random() * 0.55;
      matrix.makeRotationX(Math.PI / 2 + (random() - 0.5) * 0.8);
      matrix.setPosition(Math.cos(angle) * distance, 0.035, Math.sin(angle) * distance);
      onion.setMatrixAt(i, matrix);
    }
    this.food.add(onion);

    this.size = 1;
    this.spin = 0;
    this.step = -1;
    this.setStep(0);
  }

  setStep(step) {
    if (step === this.step) return;
    this.step = step;
    this.steps.forEach((element, index) => element.classList.toggle('active', index === step));
    if (this.stage) this.stage.dataset.stepNow = String(step);
  }

  layout() {
    if (!this.anchor) return;
    const rect = this.anchor.getBoundingClientRect();
    this.size = rect.width * 0.46;
    this.group.scale.setScalar(this.size);
  }

  update(view, seconds, time) {
    if (!this.section) return;
    const rect = this.section.getBoundingClientRect();
    this.group.visible = rect.bottom > -view.height * 0.2 && rect.top < view.height * 1.2;
    if (!this.group.visible) return;

    const progress = pinProgress(this.section, view);
    let step = 0;
    STEPS.forEach((start, index) => { if (progress >= start) step = index; });
    this.setStep(step);

    const box = screenBox(this.anchor, view);
    // Sit a little in front of the anchor's plane, so the rim at its widest
    // is the anchor's width on screen.
    this.group.position.set(box.x, box.y, 0);

    // Tip towards the reader: from nearly side-on to looking in.
    const tip = lerp(0.32, 0.95, smoothstep(0.0, 0.5, progress));
    this.spin = approach(this.spin, progress * Math.PI * 1.4, 5, seconds);
    this.bowl.rotation.set(tip, this.spin + time * 0.12, 0);
    // A small bob, so it reads as a thing in the room rather than a picture.
    this.bowl.position.y = Math.sin(time * 1.2) * 0.02;

    // Eaten: the food goes and the broth drops and narrows with the bowl.
    const eaten = smoothstep(STEPS[2], 0.88, progress);
    const left = Math.max(0.001, 1 - eaten);
    this.food.scale.setScalar(left);
    this.food.visible = left > 0.01;
    const level = lerp(-0.12, -0.44, eaten);
    this.broth.position.y = level;
    this.broth.scale.setScalar(lerp(1, 0.62, eaten));
    this.food.position.y = level + 0.005;

    // Rise into place as the chapter arrives.
    const arrive = clamp((view.height - rect.top) / view.height, 0, 1);
    this.group.scale.setScalar(this.size * lerp(0.75, 1, smoothstep(0, 1, arrive)));
  }
}
