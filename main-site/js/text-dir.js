// Sets the page's writing direction before first paint, for a reader who
// reads right to left. The i18n runtime (assets/i18n/i18n.js) sets <html
// lang> and dir too, but it is a module and runs after the page may first
// have been drawn, so an Arabic, Hebrew or Jawi reader would see the page
// flip from left-to-right to right-to-left as it loads. This settles it
// first.
//
// It covers the two cases the runtime would decide the same way: a language
// the reader picked before (stored under "locale", the runtime's storage key)
// and, on a first visit, a device whose first language is one of these: its
// exact code (ar-PS) or else its base language (ar-EG gets ar, he-IL gets
// he), but not a Latin-script tag (ar-Latn, Arabizi). Anything else is left
// to the runtime, which has the final word either way.
//
// RTL lists the right-to-left codes in assets/i18n/locales.js (dir: 'rtl').
// Keep the two in step.
(function () {
  var RTL = ["ar", "ar-PS", "he", "ms-Arab"];
  function find(tag) {
    for (var i = 0; i < RTL.length; i++) {
      if (RTL[i].toLowerCase() === String(tag).toLowerCase()) return RTL[i];
    }
    return null;
  }
  var code = null;
  try { code = localStorage.getItem("locale"); } catch (e) { /* storage blocked */ }
  if (!code) {
    var first = (navigator.languages && navigator.languages[0]) || navigator.language || "";
    if (!/-latn(-|$)/i.test(first)) code = find(first) || find(first.split("-")[0]);
  }
  code = find(code);
  if (!code) return;
  document.documentElement.setAttribute("lang", code);
  document.documentElement.setAttribute("dir", "rtl");
})();
