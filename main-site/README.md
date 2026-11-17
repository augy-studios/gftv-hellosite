# main-site

The GFTV HelloSpot website, served at hello.globalfurry.tv. It is static HTML,
CSS and ES modules with no build step. Three.js is vendored in
`js/vendor/three.module.min.js` (r169, MIT, licence beside it), so the site
loads nothing from a third-party host except Google Analytics.

## The page

`index.html` is one scrolling story in six chapters:

1. **The name card.** The card, drawn in 3D exactly over the picture in the
   page, with its smile drawn separately on top. The hero is pinned: as you
   scroll, the page holds still while the card turns over to its back and the
   smile drops off it to below the card. Once the card has turned and the page
   moves on, the line grows out of the smile's mouth. Its head stays a little
   below the middle of the screen, so it grows as you scroll, and it finishes
   the closing smile as you reach the bottom of the page.
2. **How a HelloSpot works.** Three short steps.
3. **Friends made at HelloSpots.** The photo ring. Every photo in `photos.json`
   stands on a ring that turns as you scroll, with a caption for the photo at
   the front.
4. **Takagi when?** A ramen bowl in the middle of the screen. It tips towards
   you and gets eaten, while the caption goes from "Takagi when?" to "Takagi
   now." to "Takagi eaten."
5. **Wait, what is GFTV?** From the About page on the GFTV blog.
6. **See you at the next HelloSpot!** The line comes home as the smile. Once
   the smile is whole it fades from the soft tint back to full strength, and
   the HelloSmile sticker (`assets/HelloSmile-V2.png`) fades in over it, its
   own smile exactly on the drawn one.

The smile line runs through the whole page, from the card's smile to the
closing one. It weaves left and right, in and out of the screen, and draws
itself as you scroll.

Behind it all, faint shapes like those in GFTV's 12th anniversary artwork
(circles, semicircles, quarter circles and squares), in the four GFTV colours
only (the wordmark's red, yellow, green and blue), are scattered at the sides of the screen at different depths. Near ones slide
past faster than far ones as you scroll. On phones only their edges peek in.
With the scene off they are still pictures, and the 404 page has a few too.

The site opens in the **Hello** colour theme (yellow), in light mode. Readers
can switch to Classic, dark or time-based in the theme dialog.

### Pictures

Every picture on the page (the card, the gallery and ramen photos, the closing
smile) is the original file, fetched by `js/blob-images.js` and shown through a
`blob:` URL. In the markup a picture has `data-src` rather than `src`. Opening
one in a new tab, or copying its address, gives a `blob:` URL. The 3D scene
uses the same cache, so each file is downloaded once.

Chapters 1, 3 and 4 are pinned: the chapter is tall, its stage is
`position: sticky`, and scrolling through it drives the card, the ring and the
bowl.

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
| `assets/` | Every picture the page shows (the card's two faces, gallery and ramen photos), and the Proxima Nova font. |
| `images/` | The flat HelloSmile (made by `../tools/make-icons.py`) and the manifest screenshots. |
| `js/shapes-data.js` | The background shapes: where each one is, its kind, colour, size and depth. `js/scene/shapes.js` draws them in 3D, `js/backdrop-static.js` as still pictures. |
| `js/blob-images.js` | Shows pictures through `blob:` URLs, for the page and the 3D scene. |
| `js/chrome.js` | What every page shares: theme, icons, pictures, dialogs, the update bar, the sticky header. |
| `js/app.js` | The home page: the chrome, the photo list, and starting the scene. |
| `js/scene/` | The 3D scene. `main.js` explains how scene units map to page pixels; there is one module per part (card, smile, smile line, photo ring, bowl). `card.js` holds the hero's timeline. |
| `js/scene/smile-shape.js` | The card's smile, measured from the artwork. Re-measure it if the card's front changes; the comment says how. |
| `js/prepaint.js`, `js/theme.js` | The theme's two axes (colour theme and light, dark or time-based mode), from `../docs/gftv-theme.md`. |
| `js/official-bar.js` | The official GFTV site banner, from `../docs/gftv-official.md`. |
| `js/update-bar.js`, `sw.js` | The service worker and the "new version is ready" bar, from `../docs/update-bar-spec.md`. |

## Rules worth knowing

- **Raise `VERSION` in `sw.js` by one** (it is a whole number) whenever
  anything in its `PRECACHE` list changes. That covers every page, stylesheet
  and script, the card faces and the icons. `photos.json` and the gallery photos are not precached, so adding
  a photo needs no bump.
- **No inline scripts or styles.** The Content-Security-Policy in `vercel.json`
  refuses them. Put scripts in files and set styles with `element.style` or
  classes.
- **No hardcoded colours** outside section 1 of `style.css`. The 3D scene reads
  the theme tokens too (`js/scene/colours.js`): the smile and the line are the
  text colour softened towards the page background, so they sit behind the
  words. The only fixed colours are the card's printed ink and the ramen,
  which are objects rather than interface.
- **English only, for now.** Strings are written straight into the markup. When
  languages are added, `../docs/i18n-retrofit-spec.md` is the plan the sister
  sites follow.
