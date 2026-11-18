# GFTV HelloSpot

The page a person lands on after scanning the QR code on a GFTV HelloSpot name
card: **hello.globalfurry.tv**. At furmeets and furry conventions, a HelloSpot
is where newcomers make new friends.

The site is one scrolling page with a 3D scene behind it, built with Three.js
and no build step. It is a static site on Vercel, a sister to the other GFTV
sites (HelloEvents, PolicySpot, OneLink), and shares their theme, official
site banner and update bar.

## Layout

| Path | What it is |
| --- | --- |
| `main-site/` | The website. This is the folder Vercel deploys. See [main-site/README.md](main-site/README.md). |
| `tools/make-icons.py` | Draws the app icon (`HSP-*.png`, Windows tiles), the official bar's flag and the flat HelloSmile. The favicon is GFTV PolicySpot's, copied as is, so the GFTV sites share one tab icon. |
| `tools/photos.py` | Adds a photo to the gallery, and re-reads photo sizes. |
| `docs/` | The GFTV specs this site follows: theme, official banner, update bar, Proxima Nova. |

## Deploying

On Vercel, set the project's **Root Directory** to `main-site`. There is no
build command and no output directory to set. Add `hello.globalfurry.tv` as the
project's domain. While that domain still redirects to the old site, move it
over by removing it from the old project and adding it to this one.

## Adding a photo to the gallery

```sh
python tools/photos.py add path/to/photo.jpg "Caption"
```

This copies the photo into `main-site/assets/` and adds it to the end of
`main-site/photos.json` with its caption and size. The caption shows under the
photo and is also its alt text. The site uses the original file as it is,
without resizing or converting it, and shows it through a `blob:` address, so
opening the picture in a new tab gives a `blob:` URL. The new photo shows up on
the next visit, and the service worker does not need a version bump.

To change the order or a caption, edit `main-site/photos.json` directly. To
remove a photo, delete its entry there. If you replace a photo's file in
`main-site/assets/`, run `python tools/photos.py refresh` so its size is right.

The ramen photos in the Takagi chapter are listed in `main-site/index.html`.

## Rebuilding the icon

`tools/make-icons.py` needs Python 3 with Pillow and NumPy
(`pip install pillow numpy`), as does `tools/photos.py`.

```sh
python tools/make-icons.py   # the icon set, from HelloSmile-V2.png and docs/gftv-flag.png
```

`make-icons.py` uses Arial Black for the wordmark, like the sister sites'
icons. It ships with Windows and macOS; elsewhere, set `ARIAL_BLACK` to the
font's path.

After changing anything the service worker precaches, raise `VERSION` in
`main-site/sw.js` by one. It is a whole number.
