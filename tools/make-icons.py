# GFTV HelloSpot app icon. Flat, in the GFTV icon family (GHE-*.png in
# gftv-helloevents, OLG-*.png in gftv-linktree, gsl-*.png in
# gftv-redirects-portal): a glyph over the multicolour GFTV wordmark, every
# shape outlined in ink, on the #fedc00 background.
#
# The glyph is a map pin, the "spot", with the HelloSmile in its head. The
# smile's strokes are lifted straight from assets/HelloSmile-V2.png, so it is
# the official drawing rather than a redraw; only the gradient behind them is
# replaced by flat brand yellow. No sparkles.
#
# Everything is drawn on a transparent layer at SUPERSAMPLE times the design
# size and only then scaled down, so curves are antialiased. Every shape is
# drawn on one vertical centre line (x = 512), so the pin sits centred over
# the wordmark, and the whole artwork is then centred on the icon by its
# painted extent and scaled so every painted pixel lies inside a centred
# circle of SAFE_RADIUS. That is the maskable safe zone: the icon survives
# being cropped to a circle (round avatars, Android launchers, link
# previews) with nothing cut off, so one file serves "any" and "maskable".
#
# Outputs, into main-site/:
#
#   HSP-main.png        1024   apple-touch-icon, og:image, twitter:image
#   HSP-512.png         512    manifest
#   HSP-192.png         192    manifest, header brand mark
#   tile.png, tile-wide.png    browserconfig.xml (310 and 310 by 150)
#   gftv-flag.png       72 by 48, the official bar's mark, from
#                       docs/gftv-flag.png (gftv-official.md: never the full
#                       size flag, it is on every page)
#   images/hellosmile.png  512, the flat HelloSmile on its own, shown in place
#                       of the 3D smile when WebGL or motion is off
#
# Usage, from the repo root:  python tools/make-icons.py
#
# The wordmark is Arial Black, as in the sister icons. It ships with Windows
# and macOS; set ARIAL_BLACK to its path anywhere else.
import math
import os
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SITE = os.path.join(ROOT, 'main-site')

CANVAS_SIZE = 1024
SUPERSAMPLE = 4

BACKGROUND = '#fedc00'
INK = '#2e2800'        # hello-theme text colour, the outline on every shape
SMILE_INK = (0x1a, 0x16, 0x00, 255)
YELLOW = '#fedc00'
RED = '#ef3340'        # GFTV red
RED_DARK = '#c41f2c'   # the pin's shaded half, flat, not a gradient
SHADOW = '#e0bf00'     # the pin's ground shadow, a step darker than the ground
WORD = ['#fd0000', '#ffda00', '#17ad1b', '#1a8cff']

SAFE_RADIUS = 0.40     # fraction of the icon's width

FONT_CANDIDATES = [
    os.environ.get('ARIAL_BLACK'),
    'C:/Windows/Fonts/ariblk.ttf',
    '/System/Library/Fonts/Supplemental/Arial Black.ttf',
    '/Library/Fonts/Arial Black.ttf',
    '/usr/share/fonts/truetype/msttcorefonts/Arial_Black.ttf',
]


def find_font():
    for path in FONT_CANDIDATES:
        if path and os.path.exists(path):
            return path
    sys.exit('Arial Black not found; set ARIAL_BLACK to the .ttf path')


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


STROKES = smile_strokes()


def hello_smile(layer, centre_x, centre_y, radius, outline):
    """A flat HelloSmile: ink ring, yellow disc, the official strokes."""
    draw = ImageDraw.Draw(layer)
    if outline:
        grown = radius + outline
        draw.ellipse(box(centre_x - grown, centre_y - grown, centre_x + grown, centre_y + grown), fill=INK)
    draw.ellipse(box(centre_x - radius, centre_y - radius, centre_x + radius, centre_y + radius), fill=YELLOW)
    mask = STROKES.resize((px(2 * radius), px(2 * radius)), Image.LANCZOS)
    ink = Image.new('RGBA', mask.size, SMILE_INK)
    layer.paste(ink, (px(centre_x - radius), px(centre_y - radius)), mask)


def pin_outline(radius, centre_y, tip_y, grow):
    """The pin silhouette as a polygon: a circle whose two tangents meet at
    the tip. `grow` widens it evenly, for the ink outline."""
    r = radius + grow
    # The tip moves down by more than `grow`, so the outline keeps an even
    # width along the two straight sides rather than thinning at the point.
    distance = tip_y - centre_y
    half_angle = math.asin(radius / distance)
    tip = tip_y + grow / math.sin(half_angle)
    tangent = math.acos(r / (tip - centre_y))
    points = []
    # Round the top from one tangent point to the other, then the tip.
    start = math.pi / 2 + tangent
    end = math.pi / 2 - tangent + 2 * math.pi
    steps = 180
    for i in range(steps + 1):
        angle = start + (end - start) * i / steps
        points.append((512 + r * math.cos(angle), centre_y + r * math.sin(angle)))
    points.append((512, tip))
    return [(px(x), px(y)) for x, y in points]


def pin(layer):
    """The map pin, centred on x = 512, with the HelloSmile in its head."""
    draw = ImageDraw.Draw(layer)
    centre_y, radius, tip_y = 300, 214, 612

    # A flat ground shadow under the tip, so the pin stands on the icon.
    draw.ellipse(box(512 - 96, tip_y - 10, 512 + 96, tip_y + 26), fill=SHADOW)

    draw.polygon(pin_outline(radius, centre_y, tip_y, 16), fill=INK)
    body = pin_outline(radius, centre_y, tip_y, 0)
    draw.polygon(body, fill=RED)
    # The right half one flat step darker: the uwuapps icons' half shading.
    shade = Image.new('L', layer.size, 0)
    ImageDraw.Draw(shade).polygon(body, fill=255)
    ImageDraw.Draw(shade).rectangle((0, 0, px(512), layer.height), fill=0)
    layer.paste(Image.new('RGBA', layer.size, RED_DARK), (0, 0), shade)

    hello_smile(layer, 512, centre_y, 150, outline=12)


def wordmark(layer, font_path, top):
    """GFTV, one colour per letter, each outlined so the yellow F reads on
    the yellow ground. Drawn on its own layer and centred on x = 512 by its
    inked extent, since glyph advance widths are not symmetric."""
    font = ImageFont.truetype(font_path, px(176))
    word = Image.new('RGBA', layer.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(word)
    x = 0
    for letter, colour in zip('GFTV', WORD):
        draw.text((x, px(top)), letter, font=font, fill=colour,
                  stroke_width=px(9), stroke_fill=INK)
        x += draw.textlength(letter, font=font) + px(4)
    left, _, right, _ = word.getbbox()
    layer.alpha_composite(word, (round(px(CANVAS_SIZE / 2) - (left + right) / 2), 0))


def artwork(font_path, with_wordmark=True):
    layer = Image.new('RGBA', (px(CANVAS_SIZE), px(CANVAS_SIZE)), (0, 0, 0, 0))
    pin(layer)
    if with_wordmark:
        wordmark(layer, font_path, 664)
    return layer


def centred_crop(layer):
    """Crop to the painted pixels, widened to stay symmetric about x = 512,
    so centring the crop centres the artwork exactly on both axes."""
    alpha = layer.getchannel('A').point(lambda v: 255 if v > 8 else 0)
    left, top, right, bottom = alpha.getbbox()
    axis = px(CANVAS_SIZE / 2)
    half = max(axis - left, right - axis)
    return layer.crop((axis - half, top, axis + half, bottom))


def farthest_from_centre(art):
    """Distance from the crop's centre to its farthest painted pixel, sampled
    on a reduced copy (the full one is tens of millions of pixels)."""
    step = 4
    small = np.array(art.getchannel('A').resize((art.width // step, art.height // step)))
    ys, xs = np.nonzero(small > 8)
    dx = np.abs(xs + 0.5 - small.shape[1] / 2) + 0.5
    dy = np.abs(ys + 0.5 - small.shape[0] / 2) + 0.5
    return float(np.max(np.hypot(dx, dy))) * step


def compose(art, size, scale, background=BACKGROUND, width=None):
    width = width or size
    w, h = round(art.width * scale), round(art.height * scale)
    scaled = art.resize((w, h), Image.LANCZOS)
    icon = Image.new('RGBA', (width, size), background)
    icon.alpha_composite(scaled, ((width - w) // 2, (size - h) // 2))
    return icon.convert('RGB')


def out(*parts):
    return os.path.join(SITE, *parts)


def render():
    font_path = find_font()

    art = centred_crop(artwork(font_path))
    scale = SAFE_RADIUS / farthest_from_centre(art)
    for name, size in (('HSP-main.png', 1024), ('HSP-512.png', 512), ('HSP-192.png', 192)):
        compose(art, size, scale * size).save(out(name), optimize=True)

    # Windows tiles: the same artwork, the wide one centred on a wide ground.
    compose(art, 310, scale * 310).save(out('tile.png'), optimize=True)
    compose(art, 150, scale * 150 * 1.1, width=310).save(out('tile-wide.png'), optimize=True)

    # No favicon here: main-site/favicon.ico is GFTV PolicySpot's, copied
    # as is (gftv-policyspot/main-site/favicon.ico), so the GFTV sites share
    # one browser-tab icon. Copy it again if PolicySpot's changes.

    # The flat HelloSmile on its own, transparent around the disc.
    smile = Image.new('RGBA', (px(CANVAS_SIZE), px(CANVAS_SIZE)), (0, 0, 0, 0))
    hello_smile(smile, 512, 512, 500, outline=0)
    os.makedirs(out('images'), exist_ok=True)
    smile.resize((512, 512), Image.LANCZOS).save(out('images', 'hellosmile.png'), optimize=True)

    # The official bar's mark: a small copy, never the full size flag.
    flag = Image.open(os.path.join(ROOT, 'docs', 'gftv-flag.png')).convert('RGBA')
    flag.resize((72, 48), Image.LANCZOS).save(out('gftv-flag.png'), optimize=True)

    print(f'artwork {art.width}x{art.height} at {SUPERSAMPLE}x, '
          f'fitted inside a {SAFE_RADIUS:.0%} circle')


render()
