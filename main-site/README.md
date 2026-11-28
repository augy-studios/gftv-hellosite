# main-site

The GFTV HelloSpot website, served at hello.globalfurry.tv. It is static HTML,
CSS and ES modules with no build step. Three.js is vendored in
`js/vendor/three.module.min.js` (r169, MIT, licence beside it), and the QR
encoder in `js/vendor/qrcode.module.js` (qrcode-generator 2.0.4, MIT, licence
beside it), so the site loads nothing from a third-party host except Google
Analytics.

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
   own smile exactly on the drawn one. Then the line's tail catches up with it,
   running down after the head into the smile, so no line is left trailing
   out of the sticker. Scrolling back up brings the line back.

The smile line runs through the whole page, from the card's smile to the
closing one. It weaves left and right, in and out of the screen, and draws
itself as you scroll.

Behind it all, faint shapes like those in GFTV's 12th anniversary artwork
(circles, semicircles, quarter circles and squares), in the four GFTV colours
only (the wordmark's red, yellow, green and blue), are scattered at the sides of the screen at different depths. Near ones slide
past faster than far ones as you scroll, and each one turns slowly and floats
on its own, like particles, so the background is never quite still. On phones
only their edges peek in. With the scene off they are flat pictures fixed to
the page, still turning slowly, and the 404 page has a few too. With reduced
motion nothing moves.

The line is wet paint: moving the mouse (or a finger) across it smudges it,
dragging it along before it springs back. Scrolling alone never smudges it.
Written for this site, inspired by lusion.co.

The browser's scroll bar is hidden. In its place, down the right edge, is one
dot per chapter: passed chapters are ticked, the current one is ringed, the
track between them fills as you scroll, and each dot is a link to its chapter
that shows the chapter's name on hover or focus.

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
| `js/section-dots.js` | The dots that stand in for the scroll bar. |
| `js/liquid-glass.js` | Moves the shine on the liquid glass cards' edges with the scroll. |
| `js/scene/paint.js` | The smudge on the line. |
| `js/blob-images.js` | Shows pictures through `blob:` URLs, for the page and the 3D scene. |
| `assets/i18n/` | The words of the site in each language, and the code that swaps them. See Languages below. |
| `js/chrome.js` | What every page shares: theme, icons, pictures, dialogs, the update bar, the sticky header, the share dialog. |
| `js/share.js` | The "Share the page" button in the footer and its dialog: a QR code for hello.globalfurry.tv with the app icon (`HSP-512.png`) in the middle, to download, copy or share. Drawn like the GFTV Redirects Portal's QR codes: high error correction so the icon can cover the middle, dark on light in every theme (`--qr-bg`, `--qr-fg` in section 1 of `style.css`). It always encodes the live site's address, whichever address the page was opened at. |
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
- **No gradients, with one logged exception.** The theme forbids gradients.
  HelloSpot's liquid glass cards (`.liquid` in `style.css`: the three steps and
  "Wait, what is GFTV?") have a slight shine along their edge, a soft gradient
  that moves round the edge with the scroll (`js/liquid-glass.js`). That is
  the only place a gradient is allowed; it was asked for, and stays on the
  edge of `.liquid`.
- **No hardcoded colours** outside section 1 of `style.css`. The 3D scene reads
  the theme tokens too (`js/scene/colours.js`): the smile and the line are the
  text colour softened towards the page background, so they sit behind the
  words. The only fixed colours are the card's printed ink and the ramen,
  which are objects rather than interface.
- **Every word the reader sees comes from `assets/i18n/en-GB.json`.** A new
  sentence on the page gets a key there (and in every other language file),
  and the element gets `data-i18n="the.key"`, or `t('the.key')` in a script.
  See Languages below.

## Languages

Every word on the site is in a language file, and a button next to the theme
button in the header picks the language. There are 94, listed in
`assets/i18n/locales.js`, with British English as the source and default.
They include English (US), Pirate, uwu, Singlish (`en-SINGLISH`), Braille
and Morse code, Taglish (`tl-TAGLISH`) beside Tagalog, Naijá
(Nigerian) Pidgin, Latin, a romanised variant
(`-Latn`) of every language not written in Latin letters (Arabic's is
Arabizi, Hebrew's `he-Latn`, and Persian's Finglish, `fa-Latn`), Palestinian Arabic (`ar-PS`, written as
spoken, with its own Arabizi, `ar-Latn-PS`) beside Modern Standard Arabic, and Malay in Jawi (`ms-Arab`) beside Malay in Latin
letters. Arabic, Hebrew, Jawi, Persian (`fa`, Farsi) and Dhivehi are written right to left (see
Right-to-left languages below). The language dialog lists them in alphabetical order. The
setup is the one the GFTV sister sites use, from `../docs/i18n-retrofit-spec.md`.

English (Braille), `en-Brai`, is uncontracted Unified English Braille in
Unicode braille cells, and English (Morse code), `en-MORSE`, is International
Morse code with `·` and `−`, letters a space apart and words ` / ` apart.
Neither is translated by hand: `../tools/make-braille-morse.py` writes both
from `en-GB.json`, so run it after changing any English wording
(`python tools/make-braille-morse.py`, from the repository root). They show
as two more variants in the English row.

### The files

| File | What it is | Edit it when |
| --- | --- | --- |
| `assets/i18n/en-GB.json` | Every word on the site in English, one key each: `"hero.title": "You found a HelloSpot!"`. The source every other language copies. | You change wording, or add a sentence. |
| `assets/i18n/<code>.json` | The same keys in another language (`ms.json`, `zh-SG.json` and so on). | You add or update a language. |
| `assets/i18n/locales.js` | The list of languages: which files to load, each language's own name and its writing direction. | You add a language (three lines). |
| `js/text-dir.js` | Sets right-to-left before first paint for a reader who picked Arabic, Hebrew, Jawi, Persian or Dhivehi, or whose device's first language is one of them. Lists the right-to-left codes. | You add a right-to-left language. |
| `sw.js` | The service worker. Its `PRECACHE` list must include every language file, and `VERSION` goes up by one on every change. | You add a language or change any wording. |
| `index.html`, `404.html` | The pages. Each element with words has `data-i18n="key"` (or `data-i18n-attr="alt:key"` for an attribute), with the English still in place as a fallback. | You add a new element with words. |
| `assets/i18n/check-keys.js` | Checks every language file against `en-GB.json`: missing or extra keys, broken `{placeholders}`, empty values. | Run it after any change (below). |
| `assets/i18n/i18n.js`, `switcher.js`, `boot.js` | The runtime and the language button. Shared with the sister sites. | Never, normally. |

The words that scripts write are in `en-GB.json` too: the official bar
(`official.*`), the update bar (`update.*`), the theme dialog (`theme.*`),
the share dialog (`share.*`) and the language dialog (`language.*`).
The photo captions in `photos.json` are event names and stay as they are in
every language.

### Adding a language

Say Portuguese as spoken in Brazil, `pt-BR`:

1. **Copy `assets/i18n/en-GB.json` to `assets/i18n/pt-BR.json`** and translate the
   values only. Keep every key exactly as it is, and keep anything in braces,
   like `{mode}` or `{language}`, untranslated: it is filled in when the page
   runs. Brand names (GFTV, HelloSpot, HelloSmile, Takagi) stay as they are.
2. **Register it in `assets/i18n/locales.js`**, three lines:
   ```js
   import ptBR from './pt-BR.json' with { type: 'json' };
   export const locales = { /* ... */ 'pt-BR': ptBR };
   export const registry = [
     /* ... */
     { code: 'pt-BR', name: 'Português (Brasil)', dir: 'ltr' },
   ];
   ```
   `name` is the language's name in that language. A regional variant keeps
   its region in brackets at the end, as here: `pt-BR` then shares a row with
   `pt-PT` in the language dialog, with a dropdown to pick between them.
   `dir` is `rtl` for a right-to-left language such as Arabic; add its code
   to `RTL` in `js/text-dir.js` too (see Right-to-left languages below).
   Where the entry goes in the list does not change where it shows in the
   dialog, which is alphabetical; it only matters among a language's own
   variants, where the first is the main one.
   On a phone the language button shows the code in place of the name. If
   the code is long enough to crowd the site name (as `en-SINGLISH` and
   `tl-TAGLISH` are), give the entry a shorter `abbr` for the button
   (`abbr: 'en-SG'`).
3. **Add it to the service worker**: in `sw.js`, add `'/assets/i18n/pt-BR.json',`
   to the `PRECACHE` list beside `en-GB.json`, and raise `VERSION` by one.
4. **Check it**, from `main-site/`:
   ```sh
   node assets/i18n/check-keys.js
   ```
   It lists any key that is missing, extra, empty or has different
   `{placeholders}` from English, and ends with `ok` when there are none.
   Notes headed "same as English" are only reminders to look at.
5. **Look at it**: pick the language with the button in the header and read
   down the page, including the "How to identify" panel at the top and the
   theme dialog. Reload, and it should stay picked.

A reader's language is chosen the first time they visit from their device's
languages, in the device's order of preference: the exact code (`pt-BR`), then
the base language (`pt`), then the closest site language sharing that base:
`pt-BR` gets `pt-PT`, `en-AU` gets `en-GB`, and `zh-MO` gets `zh-TW` (it is
Traditional Chinese, like `zh-TW` and `zh-HK`; the same writing system counts
first, then the same region, then the order in `locales.js`). Plain Norwegian
(`no`, `no-NO`) counts as Bokmål, `nb`, as browsers treat it; Nynorsk is `nn`.
Such aliases are in `ALIASES` in `assets/i18n/i18n.js`. If the site has
none of them, it is British English, `en-GB`
(in `locales.js`, `<html lang>` on both pages and the manifest), whose words
are in `en-GB.json`; a device asking for an English the site does not have gets
it too. After
they pick one with the button, their choice is kept.

The language dialog lists one row per language in alphabetical order of the
name the row shows, the same in every page language: Latin names A to Z
(ignoring accents and case, so Čeština is among the Cs), then the other
scripts in Unicode's order: Greek, Cyrillic, Hebrew, Arabic, the Indian scripts,
Thai, Lao, Burmese, Korean, Chinese and Japanese. A language's variants keep
their order from `locales.js` in its dropdown.

The language dialog has a search box. It matches any part of a language's own
name; its English names, from `en` in `locales.js` ("bengali", "tagalog",
"traditional chinese"); its name in the page's current language and in
English from the browser (so "chinese" finds 中文); the countries it comes
from, in English and in the page's language ("japan", "sri lanka" for
Tamil, from `regions` or the code); or its code (`en-gb`, `en_gb`, `gb`),
ignoring case and accents. Every word typed must match. Enter picks the first
row left; Escape clears the search, then closes.

**Regional variants.** Languages that share a base code (`en-GB` and `en-US`,
`zh-SG` and `zh-TW`) get one row, "English UK", with a dropdown button at its
far end listing each variant. Tapping the row itself picks the variant in use,
or else the one closest to the reader's device. Nothing extra is needed to set
this up: add the variant to `locales.js` as a language of its own, with its
region in brackets at the end of its `name` (`English (US)`,
`中文（台灣）`). The bracketed part is what the row shows after the language
name. A search that matches only some variants ("us") opens the dropdown on
just those. With the keyboard, → opens a row's variants and ← closes them.

**Right-to-left languages.** Arabic (`ar`, and `ar-PS` for Palestine),
Hebrew (`he`), Malay in Jawi (`ms-Arab`), Persian (`fa`) and Dhivehi (`dv`, in Thaana) are written right to left. Picking one sets `<html dir="rtl">` and the whole
page mirrors: the header, the official bar, the dialogs, the section dots
(which move to the left edge, where a right-to-left reader's scroll bar
would be) and the Takagi chapter (the bowl moves to the left of its words).
This works because the stylesheet uses logical properties
(`inset-inline-end`, `margin-inline-start`, `padding-inline` and so on)
rather than `left` and `right`, and flex and grid follow the writing
direction; keep it that way (section 9 of `../docs/i18n-retrofit-spec.md`).
The 3D scene places the card, ring and bowl over their anchor elements, so it
follows the mirrored layout without changes. The end of `style.css` sets
the small capitals labels without letter spacing in every right-to-left
language (neither script has capitals, and spacing would pull Arabic's joined
letters apart), and Arabic-script headings with more line height.

`js/text-dir.js` sets the direction before first paint, so the page does not
flip as it loads; its `RTL` list must match the `rtl` entries in `locales.js`.
In the language dialog every row is laid out in the page's direction, and
each name runs in its own (`dir="auto"`), so العربية reads correctly on an
English page and English on an Arabic one.

Arabic (both variants), Jawi and Persian are set in Noto Sans Arabic
(`assets/fonts/NotoSansArabic-Variable.woff2`, its Arabic letters only, one
variable file for every weight, SIL OFL, licence beside it), because many
devices' own Arabic fonts lack Jawi's extra letters (ڠ ڤ ݢ ڽ ۏ). Latin words
in those pages, like GFTV and HelloSpot, stay in Proxima Nova. The font is
fetched only on those languages, and is not precached. Hebrew is set the
same way in Noto Sans Hebrew (`assets/fonts/NotoSansHebrew-Variable.woff2`,
Hebrew letters only, 12 KB), fetched only on Hebrew. Dhivehi is set the
same way in Noto Sans Thaana (`assets/fonts/NotoSansThaana-Variable.woff2`,
24 KB), since many devices have no Thaana font at all; Thaana leans by
design, so the slant is not a fake italic.

Two more scripts get their own font, each fetched only on its language:
Dzongkha's Tibetan in Noto Serif Tibetan
(`assets/fonts/NotoSerifTibetan-Regular.woff2`, the regular weight only, 150
KB rather than 730 KB for the variable file; bold is drawn from it, as for
Proxima Nova), with more line height for its stacked letters; and English
(Braille)'s cells in Noto Sans Symbols 2
(`assets/fonts/NotoSansSymbols2-Braille.woff2`, the braille block only, 6 KB).
All are SIL OFL, licences beside them.

Brand names stay in Latin letters inside right-to-left text, and the
browser places them correctly. One thing it cannot place: a Latin run that
ends in punctuation followed by right-to-left script, such as `https://`
before an Arabic or Hebrew word, shows its punctuation on the wrong side.
Write such text so the Latin run ends in a letter (the Arabic, Hebrew,
Jawi, Persian and Dhivehi files say `https://hello.globalfurry.tv`, not a bare `https://`).

### Changing the wording

Edit the value in `en-GB.json` (and the same key in each other language file),
leave the key as it is, raise `VERSION` in `sw.js`, and run `check-keys.js`.
The English inside the HTML is only a fallback for the moment before the
language file loads; keep it in step with `en-GB.json` so the two do not drift.
