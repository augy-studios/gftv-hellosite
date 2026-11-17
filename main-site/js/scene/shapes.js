// The background shapes in 3D (the list is js/shapes-data.js). Each one is a
// flat shape at its own depth: near ones in front of the page, far ones well
// behind it. The camera moves with the scroll, so perspective does the
// parallax by itself: near shapes slide past quickly, far ones drift slowly.
//
// A shape's position and size are corrected for its depth, so that at its
// moment it sits on screen where, and as large as, the list says, whatever its
// depth. They turn slowly as the page scrolls.
//
// They are background and nothing else: drawn first, faint, and never hiding
// anything, so the card, the line, the photos and the bowl always draw over
// them, near or not. The page's text is above the canvas anyway.

import {
  CircleGeometry,
  Group,
  Mesh,
  MeshBasicMaterial,
  PlaneGeometry,
} from '../vendor/three.module.min.js';
import { backdropShapes } from '../shapes-data.js';
import { lerp } from './maths.js';

// Depth, in screen heights: from this far in front of the page to this far
// behind it.
const NEAREST = 0.35;
const FURTHEST = -1.8;
// Turn per pixel of scroll, in radians.
const SPIN = 0.00012;

// One geometry per kind, a unit size (1 = the shape's `size`), centred.
function geometries() {
  const quarter = new CircleGeometry(0.7, 48, 0, Math.PI / 2);
  quarter.translate(-0.35, -0.35, 0);
  const semicircle = new CircleGeometry(0.5, 64, 0, Math.PI);
  semicircle.translate(0, -0.15, 0);
  return {
    circle: new CircleGeometry(0.5, 64),
    semicircle,
    quarter,
    square: new PlaneGeometry(0.72, 0.72),
  };
}

export class Shapes {
  constructor(scene) {
    this.group = new Group();
    scene.add(this.group);
    this.geometries = geometries();
    this.materials = new Map();
    this.opacity = 0.25;
    this.meshes = [];
  }

  material(colour, fade) {
    const key = `${colour}:${fade.toFixed(2)}`;
    if (!this.materials.has(key)) {
      const material = new MeshBasicMaterial({ color: colour, transparent: true, depthWrite: false });
      material.userData.fade = fade;
      this.materials.set(key, material);
    }
    return this.materials.get(key);
  }

  setTheme(theme) {
    this.opacity = theme.shapeOpacity;
    for (const material of this.materials.values()) {
      material.opacity = this.opacity * material.userData.fade;
    }
  }

  layout(view) {
    for (const mesh of this.meshes) this.group.remove(mesh);
    this.meshes = [];

    const { width, height, distance } = view;
    const shapes = backdropShapes({ width, height, scrollLength: view.maxScroll });
    for (const shape of shapes) {
      const z = lerp(NEAREST, FURTHEST, shape.depth) * height;
      // How much larger the scene is at this depth than on the screen.
      const scale = (distance - z) / distance;
      // The further away, the fainter, a little.
      const fade = Math.round(lerp(1, 0.7, shape.depth) * 20) / 20;
      const mesh = new Mesh(this.geometries[shape.kind], this.material(shape.colour, fade));
      mesh.position.set(
        shape.side * shape.edge * width * scale,
        -(shape.moment + height / 2) - shape.offset * scale,
        z,
      );
      mesh.scale.setScalar(shape.size * scale);
      mesh.rotation.z = shape.rotation;
      mesh.userData.rotation = shape.rotation;
      mesh.userData.spin = shape.spin;
      // Drawn before everything, and they never block anything.
      mesh.renderOrder = -2;
      this.group.add(mesh);
      this.meshes.push(mesh);
    }
    this.setTheme({ shapeOpacity: this.opacity });
  }

  update(view) {
    for (const mesh of this.meshes) {
      mesh.rotation.z = mesh.userData.rotation + view.scrollY * SPIN * mesh.userData.spin;
    }
  }
}
