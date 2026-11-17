// The background shapes: flat circles, semicircles, quarter circles and
// squares like those in GFTV's 12th anniversary artwork ("A Part to Play",
// assets/12ANN MAWS Live and Special Events.jpg), set on the same tilted grid,
// faint, at the sides of the screen, in the four GFTV colours only.
//
// One list, made the same way on every visit, drawn two ways: in the 3D scene
// (js/scene/shapes.js), where each shape has a depth and so moves past at its
// own speed as the page scrolls, and as still shapes on the page when the
// scene is off (js/backdrop-static.js).

// The GFTV colours: the red, yellow, green and blue of the GFTV wordmark,
// sampled from the wordmark artwork (assets/image2.png). The yellow is the
// theme's --brand. Brand colours, not interface colours: they are the same in
// every theme, and only their opacity (--shape-opacity in style.css) follows
// the mode. No other colour is used for the shapes.
export const SHAPE_COLOURS = ['#ff0000', '#fedc00', '#16ae1a', '#0090ff'];

// The artwork's shapes sit on a grid tilted by about 27 degrees.
const TILT = (-27 * Math.PI) / 180;

const KINDS = ['quarter', 'semicircle', 'circle', 'quarter', 'square', 'semicircle'];

// A seeded random, so the shapes land in the same places on every visit.
function seeded(seed) {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

function lerp(from, to, amount) {
  return from + (to - from) * amount;
}

// The shapes for a screen `width` by `height` and a page that scrolls
// `scrollLength`. Each shape is described by the moment it is in the middle
// of the screen, so the 3D scene can give it a depth without changing when
// it is seen:
//
//   kind      quarter, semicircle, circle or square
//   colour    one of SHAPE_COLOURS
//   side      -1 left, 1 right
//   edge      how far its centre is from the middle of the screen, as a
//             fraction of the screen's width (0.5 is the very edge)
//   moment    the scroll position at which it is level with the screen's
//             middle, give or take `offset`
//   offset    its height on screen at that moment, from the middle, in pixels
//   size      its size on screen, in pixels
//   depth     0 nearest the reader, 1 furthest away
//   rotation  radians
//   spin      -1 or 1: which way it turns, slowly, as the page scrolls
export function backdropShapes({ width, height, scrollLength }) {
  const phone = width < 640;
  const random = seeded(2026);
  // Phones get fewer shapes, mostly off the screen, so only an edge peeks in
  // beside the text.
  const spacing = height * (phone ? 0.5 : 0.3);
  const count = Math.max(4, Math.ceil((scrollLength + height) / spacing));
  const shapes = [];
  for (let index = 0; index < count; index += 1) {
    const depth = random();
    const reach = random();
    // Nearer shapes are drawn a little larger, as they would be.
    const base = phone ? lerp(0.36, 0.6, random()) : lerp(0.14, 0.27, random());
    shapes.push({
      kind: KINDS[Math.floor(random() * KINDS.length)],
      colour: SHAPE_COLOURS[Math.floor(random() * SHAPE_COLOURS.length)],
      side: index % 2 === 0 ? -1 : 1,
      edge: phone ? lerp(0.46, 0.6, reach) : lerp(0.35, 0.52, reach),
      moment: index * spacing + (random() - 0.5) * spacing * 0.8 - height * 0.2,
      offset: (random() - 0.5) * height * 0.8,
      size: base * width * lerp(1.2, 0.75, depth),
      depth,
      rotation: TILT + (Math.PI / 2) * Math.floor(random() * 4),
      spin: random() < 0.5 ? -1 : 1,
    });
  }
  return shapes;
}
