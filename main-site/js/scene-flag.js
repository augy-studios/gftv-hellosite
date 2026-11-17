// Decides, before first paint, whether the 3D scroll scene runs, and says so
// with one class on <html>: scene-on or scene-off. The two layouts differ
// (the pinned sections are tall only when the scene drives them), so this has
// to be settled before anything is drawn or the page would jump.
//
// The scene is off when the reader asks for reduced motion, which is exactly
// the large, scroll-driven movement that setting is for, and when the browser
// has no WebGL. Everything on the page still shows either way: the static
// layout is the same content without the movement.
(function () {
  var on = true;
  try {
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) on = false;
    if (on) {
      var probe = document.createElement("canvas");
      on = !!(probe.getContext("webgl2") || probe.getContext("webgl"));
    }
  } catch (e) {
    on = false;
  }
  document.documentElement.classList.add(on ? "scene-on" : "scene-off");
})();
