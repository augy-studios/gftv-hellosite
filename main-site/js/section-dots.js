// The page's own scroll bar, in place of the browser's (hidden in style.css):
// one dot per chapter down the right edge, joined by a track.
//
//   - The chapter the middle of the screen is in is the current one: its dot
//     is ringed, and its link carries aria-current.
//   - Chapters already passed are ticked.
//   - The track fills down from the first dot as the page scrolls, reaching
//     each dot as its chapter becomes current, so it moves smoothly between
//     them rather than in steps.
//
// Each dot is a link to its chapter. A click scrolls there smoothly (at once
// with reduced motion), landing a chapter below the sticky header, or right at
// its top for a pinned chapter, whose stage fills the screen.

export function initSectionDots() {
  const nav = document.querySelector('.section-dots');
  if (!nav) return;
  const links = [...nav.querySelectorAll('a[href^="#"]')];
  const items = links
    .map((link) => ({ link, section: document.getElementById(link.getAttribute('href').slice(1)) }))
    .filter((item) => item.section);
  if (items.length === 0) return;

  const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)');
  const header = document.querySelector('.site-header');

  // Where a chapter starts on the page.
  const topOf = (section) => section.getBoundingClientRect().top + window.scrollY;

  let current = -1;
  let ticking = false;

  function update() {
    ticking = false;
    const middle = window.scrollY + window.innerHeight / 2;
    const starts = items.map(({ section }) => topOf(section));
    const ends = items.map(({ section }, index) => starts[index] + section.offsetHeight);

    // The current chapter, and how far through it the middle of the screen
    // is: the track's fill is that many dots down.
    let index = 0;
    for (let i = 0; i < items.length; i += 1) if (middle >= starts[i]) index = i;
    const span = Math.max(1, ends[index] - starts[index]);
    const within = Math.min(1, Math.max(0, (middle - starts[index]) / span));
    const atEnd = window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2;
    const filled = atEnd ? items.length - 1 : Math.min(items.length - 1, index + within);
    nav.style.setProperty('--progress', String(filled / Math.max(1, items.length - 1)));

    const active = atEnd ? items.length - 1 : index;
    if (active !== current) {
      current = active;
      items.forEach(({ link }, i) => {
        link.classList.toggle('done', i < active);
        link.classList.toggle('current', i === active);
        if (i === active) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      });
    }
  }

  const request = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(update);
  };
  window.addEventListener('scroll', request, { passive: true });
  window.addEventListener('resize', request);
  new ResizeObserver(request).observe(document.body);

  for (const { link, section } of items) {
    link.addEventListener('click', (event) => {
      event.preventDefault();
      const pinned = section.hasAttribute('data-pin');
      const gap = pinned || section.id === 'hello' ? 0 : (header?.offsetHeight || 0) + 8;
      const top = section.id === 'hello' ? 0 : Math.max(0, topOf(section) - gap);
      window.scrollTo({ top, behavior: reduce?.matches ? 'auto' : 'smooth' });
      // Keep the address and the browser's back button in step, and move
      // keyboard focus to the chapter, as following the link would.
      history.replaceState(null, '', `#${section.id}`);
      if (!section.hasAttribute('tabindex')) section.setAttribute('tabindex', '-1');
      section.focus({ preventScroll: true });
    });
  }

  update();
}
