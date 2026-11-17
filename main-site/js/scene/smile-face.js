// The card's smile, drawn in 3D: the mouth and both eyes, exactly over where
// the card's artwork prints them (card.js paints the printed one out, so there
// is only ever this one).
//
// Through the hero's pin it drops off the card to sit centred below it while
// the card turns over, changing from the card's ink to the line's soft tint
// on the way (colours.js), so it sits behind the headline it lands on rather
// than competing with it, in every theme. It then stays there,
// moving with the page, and once the pin is over the line (smile-line.js)
// grows out of the end of its mouth.

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
import { TURN_END, TURN_START } from './card.js';
import { easeInOut, screenBox, smoothstep } from './maths.js';
import { CARD_HEIGHT, CARD_WIDTH, EYES, FACE_BOX, MOUTH, STROKE_HALF_WIDTH } from './smile-shape.js';

const FACE_X = (FACE_BOX.left + FACE_BOX.right) / 2;
const FACE_Y = (FACE_BOX.top + FACE_BOX.bottom) / 2;

// A capsule from a to b: one eye.
function eye(a, b, radius, material) {
  const mesh = new Mesh(new CapsuleGeometry(radius, a.distanceTo(b), 6, 14), material);
  mesh.position.copy(a).add(b).multiplyScalar(0.5);
  mesh.quaternion.setFromUnitVectors(new Vector3(0, 1, 0), b.clone().sub(a).normalize());
  return mesh;
}

export class SmileFace {
  constructor(scene) {
    this.anchor = document.getElementById('cardAnchor');
    this.stage = document.getElementById('heroStage');
    this.hero = document.getElementById('hello');
    this.material = new MeshBasicMaterial({ color: CARD_INK.clone() });
    this.group = new Group();
    scene.add(this.group);
    this.textColour = new Color();
    this.drop = 0;
  }

  setTheme(theme) {
    this.textColour.copy(theme.line);
  }

  clear() {
    for (const child of [...this.group.children]) {
      this.group.remove(child);
      child.geometry.dispose();
    }
  }

  layout(view) {
    this.clear();
    const rect = this.anchor.getBoundingClientRect();
    const scale = rect.width / CARD_WIDTH;
    this.radius = Math.max(1.2, STROKE_HALF_WIDTH * scale);
    this.z = this.radius + 1;

    // The face's own coordinates: card pixels, centred on the face.
    const local = ([u, v]) => new Vector3((u - FACE_X) * scale, -(v - FACE_Y) * scale, 0);
    const mouth = new TubeGeometry(new CatmullRomCurve3(MOUTH.map(local)), 120, this.radius, 10, false);
    this.group.add(new Mesh(mouth, this.material));
    const cap = new SphereGeometry(this.radius, 16, 12);
    for (const end of [MOUTH[0], MOUTH[MOUTH.length - 1]]) {
      const sphere = new Mesh(cap.clone(), this.material);
      sphere.position.copy(local(end));
      this.group.add(sphere);
    }
    cap.dispose();
    for (const [a, b] of EYES) this.group.add(eye(local(a), local(b), this.radius, this.material));

    // Where the face sits, from the centre of the card: first over the
    // printed smile, then centred below the card.
    this.onCard = new Vector3((FACE_X - CARD_WIDTH / 2) * scale, -(FACE_Y - CARD_HEIGHT / 2) * scale, 0);
    const faceHalfHeight = ((FACE_BOX.bottom - FACE_BOX.top) / 2) * scale;
    const gap = Math.max(16, rect.height * 0.1);
    this.belowCard = new Vector3(0, -(rect.height / 2 + gap + faceHalfHeight), 0);

    // The end of the mouth, and the way it was heading: where the line
    // starts, and in which direction.
    this.tail = local(MOUTH[MOUTH.length - 1]);
    this.tailDirection = this.tail.clone().sub(local(MOUTH[MOUTH.length - 4])).normalize();

    // Where the mouth's end will be in the page once the pin is over and the
    // stage scrolls with the page again: the stage's last pinned position is
    // with its bottom on the hero's bottom.
    const stageRect = this.stage.getBoundingClientRect();
    const heroRect = this.hero.getBoundingClientRect();
    const heroBottom = heroRect.bottom + view.scrollY;
    const stageTop = heroBottom - stageRect.height;
    const cardCentreY = stageTop + (rect.top - stageRect.top) + rect.height / 2;
    const cardCentreX = rect.left + rect.width / 2;
    this.finalTail = new Vector3(cardCentreX - view.width / 2, -cardCentreY, this.z)
      .add(this.belowCard)
      .add(this.tail);
  }

  update(view, seconds, cardProgress) {
    if (!this.onCard) return;
    // Off the card a little ahead of the turn, so it is clear before the
    // card's edge swings round.
    this.drop = easeInOut(smoothstep(TURN_START, TURN_END * 0.85, cardProgress));

    const box = screenBox(this.anchor, view);
    const offset = this.onCard.clone().lerp(this.belowCard, this.drop);
    // It lifts towards the reader on the way down, then settles.
    const lift = Math.sin(this.drop * Math.PI) * this.radius * 8;
    this.group.position.set(box.x + offset.x, box.y + offset.y, this.z + lift);

    this.material.color.copy(CARD_INK).lerp(this.textColour, this.drop);

    const rect = this.anchor.getBoundingClientRect();
    this.group.visible = rect.bottom > -view.height && rect.top < view.height * 1.5;
  }
}

