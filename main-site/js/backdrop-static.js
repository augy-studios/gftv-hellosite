// The background shapes as still pictures on the page, for when the 3D scene
// is off (reduced motion, no WebGL) and on the 404 page. The same shapes as
// the scene's (js/shapes-data.js), each where the scene shows it at its
// moment, but fixed to the page: no depth, no parallax, no turning.

import { backdropShapes } from './shapes-data.js';

const SVG = 'http://www.w3.org/2000/svg';

// Each kind drawn in a box one unit across, centred, matching the scene's
// geometries (js/scene/shapes.js). SVG's y runs down where the scene's runs
// up, so the curved sides are mirrored top to bottom here.
function shapeElement(kind, colour) {
  let element;
  if (kind === 'circle') {
    element = document.createElementNS(SVG, 'circle');
    element.setAttribute('r', '0.5');
  } else if (kind === 'square') {
    element = document.createElementNS(SVG, 'rect');
    for (const [name, value] of [['x', -0.36], ['y', -0.36], ['width', 0.72], ['height', 0.72]]) {
      element.setAttribute(name, String(value));
    }
  } else {
    element = document.createElementNS(SVG, 'path');
    element.setAttribute('d', kind === 'semicircle'
      ? 'M -0.5 0.15 A 0.5 0.5 0 0 1 0.5 0.15 Z'
      : 'M -0.35 0.35 L 0.35 0.35 A 0.7 0.7 0 0 0 -0.35 -0.35 Z');
  }
  element.setAttribute('fill', colour);
  return element;
}

let layer = null;

function draw() {
  if (!layer) return;
  layer.replaceChildren();
  const width = document.documentElement.clientWidth;
  const height = window.innerHeight;
  const pageHeight = document.documentElement.scrollHeight;
  const shapes = backdropShapes({ width, height, scrollLength: Math.max(0, pageHeight - height) });
  for (const shape of shapes) {
    const svg = document.createElementNS(SVG, 'svg');
    svg.setAttribute('viewBox', '-0.5 -0.5 1 1');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');
    const group = document.createElementNS(SVG, 'g');
    // The scene turns anticlockwise for a positive angle, SVG clockwise.
    group.setAttribute('transform', `rotate(${(-shape.rotation * 180) / Math.PI})`);
    group.setAttribute('opacity', String(1 - shape.depth * 0.3));
    group.append(shapeElement(shape.kind, shape.colour));
    svg.append(group);
    svg.style.width = `${shape.size}px`;
    svg.style.height = `${shape.size}px`;
    svg.style.left = `${width / 2 + shape.side * shape.edge * width - shape.size / 2}px`;
    svg.style.top = `${shape.moment + height / 2 + shape.offset - shape.size / 2}px`;
    layer.append(svg);
  }
  layer.style.height = `${pageHeight}px`;
}

// Draws the shapes into a layer behind the page, and again whenever the
// page's size changes.
export function showStaticBackdrop() {
  if (layer) return;
  layer = document.createElement('div');
  layer.className = 'backdrop';
  layer.setAttribute('aria-hidden', 'true');
  document.body.prepend(layer);
  let pending = null;
  const redraw = () => {
    clearTimeout(pending);
    pending = setTimeout(draw, 150);
  };
  window.addEventListener('resize', redraw);
  new ResizeObserver(redraw).observe(document.querySelector('main') || document.body);
  draw();
}
