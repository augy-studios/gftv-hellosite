// Sets the page's writing direction before first paint, for a reader who
// reads right to left. The i18n runtime (assets/i18n/i18n.js) sets <html
// lang> and dir too, but it is a module and runs after the page may first
// have been drawn, so an Arabic or Jawi reader would see the page flip from
// left-to-right to right-to-left as it loads. This settles it first.
//
// It covers the two cases the runtime would decide the same way: a language
// the reader picked before (stored under "locale", the runtime's storage key)
// and, on a first visit, a device whose first language is Arabic (ar, ar-EG,
// but not ar-Latn, Arabizi). Anything else is left to the runtime, which has
// the final word either way.
//
// RTL lists the right-to-left codes in assets/i18n/locales.js (dir: 'rtl').
// Keep the two in step.
(function () {
  var RTL = ["ar", "ms-Arab"];
  var code = null;
  try { code = localStorage.getItem("locale"); } catch (e) { /* storage blocked */ }
  if (!code) {
    var first = (navigator.languages && navigator.languages[0]) || navigator.language || "";
    if (/^ar(-|$)/i.test(first) && !/-latn(-|$)/i.test(first)) code = "ar";
  }
  if (RTL.indexOf(code) === -1) return;
  document.documentElement.setAttribute("lang", code);
  document.documentElement.setAttribute("dir", "rtl");
})();
