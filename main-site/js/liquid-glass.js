// The light on the liquid glass cards (.liquid in style.css) follows the
// scroll: each card's --shine runs from 1 as it comes up from the bottom of
// the screen to 0 as it leaves at the top, and the stylesheet slides the
// corner glints and the edge shimmer by it, like light catching glass as it
// passes. Nothing moves while the page is still.
//
// With reduced motion the light holds still, at one place on every card.

const STILL = 0.35;

export function initLiquidGlass() {
  const cards = [...document.querySelectorAll('.liquid')];
  if (cards.length === 0) return;

  const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)');
  if (reduce?.matches) {
    cards.forEach((card) => card.style.setProperty('--shine', String(STILL)));
    return;
  }

  let ticking = false;
  const update = () => {
    ticking = false;
    const height = window.innerHeight;
    for (const card of cards) {
      const rect = card.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > height) continue;
      const shine = Math.min(1, Math.max(0, (rect.top + rect.height / 2) / height));
      card.style.setProperty('--shine', shine.toFixed(3));
    }
  };
  const request = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(update);
  };
  window.addEventListener('scroll', request, { passive: true });
  window.addEventListener('resize', request);
  update();
}
