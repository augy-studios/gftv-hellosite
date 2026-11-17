// Small numeric helpers shared by the scene modules.

export function clamp(value, low, high) {
  return Math.min(high, Math.max(low, value));
}

export function lerp(from, to, amount) {
  return from + (to - from) * amount;
}

export function smoothstep(edge0, edge1, value) {
  const t = clamp((value - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

export function easeInOut(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

// Frame-rate independent easing towards a target: `rate` is how quickly, per
// second, the gap closes.
export function approach(current, target, rate, seconds) {
  return lerp(current, target, 1 - Math.exp(-rate * seconds));
}

// How far through a pinned chapter the page has scrolled, 0 to 1: 0 when the
// chapter's top reaches the top of the screen, 1 when its bottom reaches the
// bottom, which is exactly the stretch its sticky stage stays put for.
export function pinProgress(element, view) {
  const rect = element.getBoundingClientRect();
  const travel = rect.height - view.height;
  if (travel <= 0) return 0;
  return clamp(-rect.top / travel, 0, 1);
}

// A DOM element's centre and size in scene units (page pixels, y up, x from
// the middle of the screen), for an element that is on screen now. Pinned
// stages are measured this way every frame, since they do not move with the
// page while pinned.
export function screenBox(element, view) {
  const rect = element.getBoundingClientRect();
  return {
    x: rect.left + rect.width / 2 - view.width / 2,
    y: -(rect.top + view.scrollY + rect.height / 2),
    width: rect.width,
    height: rect.height,
  };
}
