# GFTV HelloSpot's icon set.
#
# The app icon is GFTV PolicySpot's, the same picture under HelloSpot's names,
# so the GFTV sites share one icon (as they share one favicon). It is taken
# from a checkout of gftv-policyspot next to this repo, or from POLICYSPOT if
# set to its main-site folder:
#
#   HSP-192.png, HSP-512.png   GHS-192.png and GHS-512.png, copied as is
#                              (manifest; HSP-192 is also the header mark)
#   HSP-main.png        1024   GHS-main.png scaled down (apple-touch-icon,
#                              og:image, twitter:image)
#   tile.png            310    browserconfig.xml, from GHS-main.png
#   tile-wide.png  310 by 150  the same, centred on the tile colour
#
# PolicySpot's picture runs to its edges, with the GFTV badge in a corner, so
# it is not cropped to a circle: the manifest lists these icons as "any" only,
# never "maskable", as PolicySpot's does.
#
# No favicon here either: main-site/favicon.ico is PolicySpot's, copied as
# is. Copy it, and run this again, if PolicySpot's icon changes.
#
# Also drawn here, into main-site/:
#
#   gftv-flag.png       72 by 48, the official bar's mark, from
#                       docs/gftv-flag.png (gftv-official.md: never the full
#                       size flag, it is on every page)
#   images/hellosmile.png  512, the flat HelloSmile on its own, shown in place
#                       of the 3D smile when WebGL or motion is off. Its
#                       strokes are lifted straight from
#                       assets/HelloSmile-V2.png, drawn at SUPERSAMPLE times
#                       the size and scaled down, so curves are antialiased.
#
# Usage, from the repo root:  python tools/make-icons.py
import os
import shutil
import sys

import numpy as np
from PIL import Image, ImageDraw

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SITE = os.path.join(ROOT, 'main-site')
POLICYSPOT = os.environ.get('POLICYSPOT') or os.path.join(os.path.dirname(ROOT), 'gftv-policyspot', 'main-site')

CANVAS_SIZE = 1024
SUPERSAMPLE = 4

TILE_COLOUR = '#fedc00'  # browserconfig.xml's TileColor
YELLOW = '#fedc00'
SMILE_INK = (0x1a, 0x16, 0x00, 255)


def px(units):
    """Design units to drawing pixels."""
    return round(units * SUPERSAMPLE)


def box(left, top, right, bottom):
    return (px(left), px(top), px(right), px(bottom))


def smile_strokes():
    """The HelloSmile's black strokes as an alpha mask, from the official
    artwork. The artwork's yellow disc fills its square edge to edge, so the
    mask lines up with any circle drawn over the same box."""
    source = np.array(Image.open(os.path.join(SITE, 'assets', 'HelloSmile-V2.png')).convert('RGBA'))
    dark = (source[:, :, 3] > 128) & (source[:, :, 0] < 90) & (source[:, :, 1] < 90)
    return Image.fromarray((dark * 255).astype('uint8'))


def hello_smile(layer, centre_x, centre_y, radius):
    """A flat HelloSmile: yellow disc, the official strokes."""
    draw = ImageDraw.Draw(layer)
    draw.ellipse(box(centre_x - radius, centre_y - radius, centre_x + radius, centre_y + radius), fill=YELLOW)
    strokes = smile_strokes()
    mask = strokes.resize((px(2 * radius), px(2 * radius)), Image.LANCZOS)
    ink = Image.new('RGBA', mask.size, SMILE_INK)
    layer.paste(ink, (px(centre_x - radius), px(centre_y - radius)), mask)


def out(*parts):
    return os.path.join(SITE, *parts)


def app_icons():
    source = lambda name: os.path.join(POLICYSPOT, name)
    if not os.path.exists(source('GHS-main.png')):
        sys.exit(f'GFTV PolicySpot icons not found in {POLICYSPOT}; set POLICYSPOT to its main-site folder')

    for size in (192, 512):
        shutil.copyfile(source(f'GHS-{size}.png'), out(f'HSP-{size}.png'))

    # Opaque, for iOS, which draws a transparent apple-touch-icon on black.
    main = Image.open(source('GHS-main.png')).convert('RGB')
    main.resize((1024, 1024), Image.LANCZOS).save(out('HSP-main.png'), optimize=True)
    main.resize((310, 310), Image.LANCZOS).save(out('tile.png'), optimize=True)
    wide = Image.new('RGB', (310, 150), TILE_COLOUR)
    wide.paste(main.resize((150, 150), Image.LANCZOS), (80, 0))
    wide.save(out('tile-wide.png'), optimize=True)


def render():
    app_icons()

    # The flat HelloSmile on its own, transparent around the disc.
    smile = Image.new('RGBA', (px(CANVAS_SIZE), px(CANVAS_SIZE)), (0, 0, 0, 0))
    hello_smile(smile, 512, 512, 500)
    os.makedirs(out('images'), exist_ok=True)
    smile.resize((512, 512), Image.LANCZOS).save(out('images', 'hellosmile.png'), optimize=True)

    # The official bar's mark: a small copy, never the full size flag.
    flag = Image.open(os.path.join(ROOT, 'docs', 'gftv-flag.png')).convert('RGBA')
    flag.resize((72, 48), Image.LANCZOS).save(out('gftv-flag.png'), optimize=True)

    print(f'app icons from {POLICYSPOT}')


render()
