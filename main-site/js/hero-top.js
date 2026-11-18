// Sets --hero-top, where the hero's pinned stage sits: just below the official
// bar and the header. Loaded synchronously right after the header, so the
// stage has its height before the page is first drawn and nothing jumps.
// js/app.js keeps it up to date afterwards (a resize, the bar's panel opened).
// A file rather than an inline script, which the Content-Security-Policy
// refuses.
(function () {
  var header = document.querySelector(".site-header");
  if (!header) return;
  var top = header.getBoundingClientRect().bottom + window.scrollY;
  document.documentElement.style.setProperty("--hero-top", Math.max(0, Math.round(top)) + "px");
})();
