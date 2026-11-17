# main-site

The GFTV HelloSpot website, served at hello.globalfurry.tv. It is static HTML,
CSS and ES modules with no build step. Three.js is vendored in
`js/vendor/three.module.min.js` (r169, MIT, licence beside it), so the site
loads nothing from a third-party host except Google Analytics.

## The page

`index.html` is one scrolling story in six chapters:

1. **The name card.** The card's front, drawn in 3D exactly over the picture in
   the page. As you scroll it turns over to show its back and falls away. Its
   smile stays in front and becomes the start of the line.
2. **How a HelloSpot works.** Three short steps.
3. **Friends made at HelloSpots.** The photo ring. Every photo in `photos.json`
   stands on a ring that turns as you scroll, with a caption for the photo at
   the front.
4. **Takagi when?** A ramen bowl in the middle of the screen. It tips towards
   you and gets eaten, while the caption goes from "Takagi when?" to "Takagi
   now." to "Takagi eaten."
5. **Wait, what is GFTV?** From the About page on the GFTV blog.
6. **See you at the next HelloSpot!** The line comes home as the smile,
   mirrored left to right.

The smile line runs through the whole page, from the card's smile to the
closing one. It weaves left and right, in and out of the screen, and draws
itself as you scroll.

Chapters 3 and 4 are pinned: the chapter is tall, its stage is
`position: sticky`, and scrolling through it drives the ring and the bowl.

### Without the 3D scene

`js/scene-flag.js` runs in `<head>` and sets `scene-on` or `scene-off` on
`<html>` before first paint. The scene is off for anyone who asks their device
for reduced motion, and in browsers without WebGL. The page then shows the
same content as an ordinary page: the card picture, a photo grid, all three
Takagi lines with the ramen photos, and the flat HelloSmile at the end. If the
scene fails after starting (it cannot load, or WebGL is lost), the page
switches to that layout.

## Files

| Path | What it is |
| --- | --- |
| `index.html`, `404.html` | The two pages. |
| `style.css` | Section 1 is the GFTV theme contract (`../docs/gftv-theme.md`), shared with the sister sites. Section 2 is the site chrome, section 3 the story. |
| `photos.json` | The gallery, in order. Written by `../tools/photos.py`, safe to edit by hand. |
| `images/` | Web copies of every picture the page shows, plus the manifest screenshots. Made by `../tools/photos.py` and `../tools/make-icons.py`. |
| `assets/` | The original pictures, and the Proxima Nova font. Only the font is deployed (`.vercelignore`). |
| `js/chrome.js` | What every page shares: theme, icons, dialogs, the update bar, the sticky header. |
| `js/app.js` | The home page: the chrome, the photo list, and starting the scene. |
| `js/scene/` | The 3D scene. `main.js` explains how scene units map to page pixels; there is one module per part (card, smile line, photo ring, bowl). |
| `js/scene/smile-shape.js` | The card's smile, measured from the artwork. Re-measure it if the card's front changes; the comment says how. |
| `js/prepaint.js`, `js/theme.js` | The theme's two axes (colour theme and light, dark or time-based mode), from `../docs/gftv-theme.md`. |
| `js/official-bar.js` | The official GFTV site banner, from `../docs/gftv-official.md`. |
| `js/update-bar.js`, `sw.js` | The service worker and the "new version is ready" bar, from `../docs/update-bar-spec.md`. |

## Rules worth knowing

- **Bump `VERSION` in `sw.js`** whenever anything in its `PRECACHE` list
  changes. That covers every page, stylesheet and script, the card faces and
  the icons. `photos.json` and the gallery photos are not precached, so adding
  a photo needs no bump.
- **No inline scripts or styles.** The Content-Security-Policy in `vercel.json`
  refuses them. Put scripts in files and set styles with `element.style` or
  classes.
- **No hardcoded colours** outside section 1 of `style.css`. The 3D scene reads
  the theme tokens too (`js/scene/colours.js`). The only fixed colours are the
  card's printed ink and the ramen, which are objects rather than interface.
- **English only, for now.** Strings are written straight into the markup. When
  languages are added, `../docs/i18n-retrofit-spec.md` is the plan the sister
  sites follow.
