// The photo ring. Every photo in photos.json stands on a ring that turns as
// the gallery chapter scrolls, bringing each one to the front in turn; the
// caption under it names the photo at the front. The ring is drawn over
// #ringAnchor inside the chapter's sticky stage, so it stays on screen while
// the chapter scrolls past.
//
// Photos face outwards, so the far side of the ring is turned away from the
// reader and not drawn. Their corners are rounded with a shared alpha mask.

import {
  CanvasTexture,
  Group,
  Mesh,
  MeshBasicMaterial,
  PlaneGeometry,
  SRGBColorSpace,
  TextureLoader,
} from '../vendor/three.module.min.js';
import { approach, pinProgress, screenBox } from './maths.js';
import { blobUrl } from '../blob-images.js';

// A white rounded rectangle on black: the corner mask for every photo.
function cornerMask() {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext('2d');
  context.fillStyle = '#000';
  context.fillRect(0, 0, size, size);
  context.fillStyle = '#fff';
  context.beginPath();
  context.roundRect(2, 2, size - 4, size - 4, 18);
  context.fill();
  return new CanvasTexture(canvas);
}

export class PhotoRing {
  constructor(scene, renderer, photos) {
    this.photos = photos;
    this.section = document.getElementById('gallery');
    this.anchor = document.getElementById('ringAnchor');
    this.caption = document.getElementById('ringCaption');
    this.group = new Group();
    this.spin = new Group();
    this.group.add(this.spin);
    scene.add(this.group);

    const mask = cornerMask();
    this.loader = new TextureLoader();
    this.anisotropy = renderer.capabilities.getMaxAnisotropy();
    this.meshes = photos.map((photo) => {
      const material = new MeshBasicMaterial({ alphaMap: mask, alphaTest: 0.5 });
      material.color.set('#cccccc');
      const mesh = new Mesh(new PlaneGeometry(1, 1), material);
      mesh.userData.aspect = photo.width && photo.height ? photo.width / photo.height : 1;
      this.spin.add(mesh);
      return mesh;
    });

    this.turn = 0;
    this.front = -1;
    this.loading = false;
  }

  // The photos are full size, so they are fetched only once the gallery is
  // within a couple of screens, not with the rest of the page. Through
  // blobUrl(), so the photo list shares the same downloads.
  loadPhotos() {
    if (this.loading) return;
    this.loading = true;
    this.photos.forEach((photo, index) => {
      const material = this.meshes[index].material;
      blobUrl(photo.src).then((url) => {
        this.loader.load(url, (texture) => {
          texture.colorSpace = SRGBColorSpace;
          texture.anisotropy = this.anisotropy;
          material.map = texture;
          material.color.set('#ffffff');
          material.needsUpdate = true;
        });
      }).catch((cause) => console.warn('gallery photo not loaded:', cause));
    });
  }

  setTheme(theme) {
    // Photos still loading show as a plain tile in the theme's surface colour.
    for (const mesh of this.meshes) {
      if (!mesh.material.map) mesh.material.color.copy(theme.surface);
    }
  }

  layout() {
    const count = this.meshes.length;
    if (!count || !this.anchor) return;
    const rect = this.anchor.getBoundingClientRect();
    const height = rect.height * 0.8;
    const widths = this.meshes.map((mesh) => height * mesh.userData.aspect);
    const widest = Math.max(...widths);
    // Wide enough round that neighbours never overlap, and at least as wide
    // as the stage, so the ring fills it.
    const room = widths.reduce((sum, width) => sum + width, 0) * 1.25;
    this.radius = Math.max(rect.width * 0.42, room / (2 * Math.PI), widest);
    this.meshes.forEach((mesh, index) => {
      const angle = (index / count) * Math.PI * 2;
      mesh.scale.set(widths[index], height, 1);
      mesh.position.set(Math.sin(angle) * this.radius, 0, Math.cos(angle) * this.radius);
      mesh.rotation.set(0, angle, 0);
    });
  }

  update(view, seconds, time) {
    const count = this.meshes.length;
    const rect = this.section.getBoundingClientRect();
    if (rect.top < view.height * 2.5) this.loadPhotos();
    this.group.visible = count > 0 && rect.bottom > -view.height * 0.2 && rect.top < view.height * 1.2;
    if (!this.group.visible) return;

    // Each photo comes round to the front once over the chapter.
    const progress = pinProgress(this.section, view);
    const target = progress * (count - 1);
    this.turn = approach(this.turn, target, 6, seconds);

    const box = screenBox(this.anchor, view);
    this.group.position.set(box.x, box.y, -this.radius);
    this.spin.rotation.y = -(this.turn / count) * Math.PI * 2;
    // A gentle lean, and a lean the other way on the way in and out.
    this.group.rotation.x = 0.1 + (0.5 - Math.abs(progress - 0.5)) * -0.08;
    this.meshes.forEach((mesh, index) => {
      mesh.position.y = Math.sin(time * 0.8 + index * 1.3) * box.height * 0.015;
    });

    const front = Math.round(this.turn) % count;
    if (front !== this.front && this.caption) {
      this.front = front;
      const number = document.createElement('strong');
      number.textContent = `${front + 1} / ${count}`;
      this.caption.replaceChildren(number, document.createTextNode(this.photos[front].alt));
    }
  }
}
