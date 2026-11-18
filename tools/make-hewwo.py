# Makes the uwu card front: "Hello!" on assets/12Ann Front.png becomes
# "Hewwo!". H, e, o and ! are the card's own letters; each w is Montserrat,
# sized and weighted to match. The word is scaled to fit before the smile's
# disc, on the same baseline, with a drop shadow fitted to the original's.
# usage: python hewwo.py <card front png> <montserrat ttf> <out png>
import sys
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter

SRC, FONT, OUT = sys.argv[1:4]
img = np.asarray(Image.open(SRC).convert('RGB')).astype(np.float64)
H, W, _ = img.shape

# ---- 1. the letters of "Hello!" ----
GLYPHS = [(80, 203), (223, 323), (342, 367), (393, 418), (437, 545), (558, 589)]  # H e l l o !
TOP, BASE = 100, 252                     # the word's rows (cap top 109, baseline ~247)
white = img.min(axis=2) > 200
text = np.zeros((H, W), bool)
text[TOP:BASE + 1, 75:600] = white[TOP:BASE + 1, 75:600]
# The thin light line between the red and yellow bands is background, not text.
LINE = lambda y: 621.4 - 1.278 * y
yy, xx = np.mgrid[0:H, 0:W]
on_line = np.abs(xx - LINE(yy)) < 3.0
text &= ~(on_line & (img.min(axis=2) < 245))

# Area to rebuild: the letters and their soft shadow.
def dilate(mask, r):
    return np.asarray(Image.fromarray((mask * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(2 * r + 1))) > 0

fill = dilate(text, 13)
fill = dilate(fill, 12)
fill[BASE + 30:, :] = False             # never into 哈喽 below
fill[:, 640:] = False                    # never into the disc
keep_out = dilate(white & (yy > 262), 3)  # 哈喽's own pixels
fill &= ~keep_out

# ---- 2. rebuild the background behind them ----
# Walk along lines parallel to the band edge (they never cross it), and
# interpolate between the nearest untouched pixels either way.
d = np.array([-1.278, 1.0]); d /= np.linalg.norm(d)
bg = img.copy()
ys, xs = np.nonzero(fill)
unusable = fill | dilate(white, 2) & ~on_line
for y, x in zip(ys, xs):
    found = []
    for sign in (1, -1):
        for t in range(1, 400):
            px, py = x + sign * d[0] * t, y + sign * d[1] * t
            ix, iy = int(round(px)), int(round(py))
            if not (0 <= ix < W and 0 <= iy < H):
                break
            if not unusable[iy, ix]:
                found.append((t, img[iy, ix]))
                break
    if len(found) == 2:
        (t1, c1), (t2, c2) = found
        bg[y, x] = (c1 * t2 + c2 * t1) / (t1 + t2)
    elif found:
        bg[y, x] = found[0][1]

# ---- 3. the original letters as alpha, against the rebuilt background ----
B = 2  # blue carries the contrast: white is 255, the bands are 0 to 70
alpha_full = np.clip((img[:, :, B] - bg[:, :, B]) / np.maximum(255 - bg[:, :, B], 1), 0, 1)
alpha_full[~dilate(text, 2)] = 0

def glyph(i):
    a, b = GLYPHS[i]
    a0, b0 = a - 3, b + 4
    return alpha_full[TOP - 3:BASE + 4, a0:b0], a0

# ---- 4. fit the original shadow: darkening = k * blur(alpha moved down dy) ----
ring = dilate(text, 16) & ~dilate(text, 2) & fill
best = None
alpha_img = Image.fromarray((alpha_full * 255).astype(np.uint8))
for sigma in (4, 6, 8, 10, 12):
    blurred = np.asarray(alpha_img.filter(ImageFilter.GaussianBlur(sigma))).astype(np.float64) / 255
    for dy in (0, 2, 4, 6, 8):
        sh = np.roll(blurred, dy, axis=0)
        ratio = img[:, :, 1] / np.maximum(bg[:, :, 1], 1)
        target = 1 - ratio
        s = sh[ring]
        k = float((s * target[ring]).sum() / max((s * s).sum(), 1e-9))
        err = float(((target[ring] - k * s) ** 2).mean())
        if best is None or err < best[0]:
            best = (err, sigma, dy, k)
_, SIGMA, DY, K = best
print(f'shadow: sigma {SIGMA}, dy {DY}, strength {K:.3f}')

# ---- 5. the w: Montserrat at the letters' x-height and stem weight ----
X_HEIGHT = 247 - 145          # e and o
STEM = 29                     # the l's stem (26), plus a little: diagonals read thinner than uprights

def render(ch, size, weight):
    font = ImageFont.truetype(FONT, size)
    try:
        font.set_variation_by_axes([weight])
    except Exception:
        pass
    canvas = Image.new('L', (size * 2, size * 2), 0)
    ImageDraw.Draw(canvas).text((size // 2, size // 2), ch, font=font, fill=255)
    arr = np.asarray(canvas).astype(np.float64) / 255
    return arr

def bbox(arr):
    ys, xs = np.nonzero(arr > 0.5)
    return xs.min(), ys.min(), xs.max(), ys.max()

choice = None
for weight in range(600, 901, 25):
    size = 160
    for _ in range(3):  # size so that x is X_HEIGHT tall
        x0, y0, x1, y1 = bbox(render('x', size, weight))
        size = int(round(size * X_HEIGHT / (y1 - y0 + 1)))
    l = render('l', size, weight)
    lx0, ly0, lx1, ly1 = bbox(l)
    stem = lx1 - lx0 + 1
    if choice is None or abs(stem - STEM) < abs(choice[2] - STEM):
        choice = (weight, size, stem)
WEIGHT, SIZE, _ = choice
print('w: Montserrat weight', WEIGHT, 'size', SIZE)
w = render('w', SIZE, WEIGHT)
wx0, wy0, wx1, wy1 = bbox(w)
w = w[wy0 - 2:wy1 + 3, wx0 - 2:wx1 + 3]

# ---- 6. lay out "Hewwo!" and scale it to fit before the disc ----
pieces = []  # (alpha, width, gap before)
for i, gap in ((0, 0), (1, 20)):
    a, _ = glyph(i)
    pieces.append((a, 'orig', gap))
pieces.append((w, 'w', 4))
pieces.append((w, 'w', -6))
for i, gap in ((4, 4), (5, 13)):
    a, _ = glyph(i)
    pieces.append((a, 'orig', gap))
natural = sum(p[0].shape[1] + p[2] for p in pieces)
RIGHT = 625                              # clear of the disc at the !'s height
scale = min(1.0, (RIGHT - 77) / natural)
print(f'natural width {natural}px, scale {scale:.3f}')

layer = np.zeros((H, W))
x = 77.0
for a, kind, gap in pieces:
    x += gap * scale
    if kind == 'orig':
        h_ = a.shape[0]
        bottom = BASE + 4                 # glyph crops share one baseline box
    else:
        h_ = a.shape[0]
        bottom = 247 + 3                  # the w's own bottom is the baseline
    nw, nh = max(1, int(round(a.shape[1] * scale))), max(1, int(round(h_ * scale)))
    resized = np.asarray(Image.fromarray((a * 255).astype(np.uint8)).resize((nw, nh), Image.LANCZOS)).astype(np.float64) / 255
    top = int(round(BASE + 4 - (BASE + 4 - (bottom - h_)) * scale)) if kind == 'orig' else int(round(247 - (247 - (bottom - h_)) * scale))
    left = int(round(x))
    region = layer[top:top + nh, left:left + nw]
    layer[top:top + nh, left:left + nw] = np.maximum(region, resized[:region.shape[0], :region.shape[1]])
    x += nw
print('word ends at x', int(x))

# ---- 7. compose: rebuilt background, fitted shadow, white letters ----
shadow = np.asarray(Image.fromarray((layer * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(SIGMA))).astype(np.float64) / 255
shadow = np.roll(shadow, DY, axis=0)
out = img.copy()
region = fill | (layer > 0) | (shadow > 0.01)
region[BASE + 30:, :] = False
region[:, 640:] = False
region &= ~keep_out
base = np.where(region[..., None], bg, img)
base = base * (1 - K * shadow[..., None])
out = np.where(region[..., None], base * (1 - layer[..., None]) + 255 * layer[..., None], img)
Image.fromarray(np.clip(out + 0.5, 0, 255).astype(np.uint8)).save(OUT, optimize=True)
print('saved', OUT)
