# Web copies of the HelloSpot pictures, and the one command for adding a photo
# to the gallery.
#
# The originals in main-site/assets/ stay as they are; the page loads small
# WebP copies from main-site/images/, which this script writes:
#
#   images/gallery/<name>.webp   every photo listed in main-site/photos.json
#   images/card-front.webp       the name card, both faces
#   images/card-back.webp
#   images/ramen/<name>.webp     the Takagi section's photos
#
# Usage, from the repo root:
#
#   python tools/photos.py build
#       Rewrite every web copy from its original.
#
#   python tools/photos.py add path/to/photo.jpg "What the photo shows"
#       Copy the photo into main-site/assets/ (if it is not there already),
#       add it to the end of main-site/photos.json with that description, and
#       write its web copy. The description is the photo's alt text: say what
#       is in it, for somebody who cannot see it.
#
# photos.json is read by the page at runtime, network first, so a new photo
# shows up on the next visit without a service worker version bump.
import json
import os
import shutil
import sys

from PIL import Image, ImageOps

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SITE = os.path.join(ROOT, 'main-site')
ASSETS = os.path.join(SITE, 'assets')
PHOTOS_JSON = os.path.join(SITE, 'photos.json')

GALLERY_EDGE = 1024     # longest edge of a gallery copy, in pixels
CARD_WIDTH = 1280       # the card faces keep their full width: they fill the hero
RAMEN_EDGE = 900
QUALITY = 82

CARD = {'card-front.webp': '12Ann Front.png', 'card-back.webp': '12Ann Back.png'}
RAMEN = ['ramen-1.jpg', 'ramen-2.jpg', 'ramen-3.jpg']


def web_copy(source, target, longest_edge, keep_alpha=False):
    """A WebP copy of `source`, its longest edge at most `longest_edge`,
    turned upright by its EXIF orientation."""
    image = ImageOps.exif_transpose(Image.open(source))
    image = image.convert('RGBA' if keep_alpha else 'RGB')
    image.thumbnail((longest_edge, longest_edge), Image.LANCZOS)
    os.makedirs(os.path.dirname(target), exist_ok=True)
    image.save(target, 'WEBP', quality=QUALITY, method=6)
    return image.size


def gallery_name(file):
    return os.path.splitext(file)[0].replace(' ', '-').lower() + '.webp'


def load_photos():
    with open(PHOTOS_JSON, encoding='utf-8') as handle:
        return json.load(handle)


def save_photos(photos):
    with open(PHOTOS_JSON, 'w', encoding='utf-8') as handle:
        json.dump(photos, handle, ensure_ascii=False, indent=2)
        handle.write('\n')


def build_gallery_entry(entry):
    source = os.path.join(ASSETS, entry['file'])
    target = os.path.join(SITE, 'images', 'gallery', gallery_name(entry['file']))
    width, height = web_copy(source, target, GALLERY_EDGE)
    # The page sizes each frame from these before the picture arrives.
    entry['src'] = '/images/gallery/' + gallery_name(entry['file'])
    entry['width'] = width
    entry['height'] = height
    print(f'  {entry["src"]}  {width}x{height}')


def build():
    photos = load_photos()
    print('gallery')
    for entry in photos:
        build_gallery_entry(entry)
    save_photos(photos)

    print('card')
    for target, source in CARD.items():
        size = web_copy(os.path.join(ASSETS, source), os.path.join(SITE, 'images', target), CARD_WIDTH)
        print(f'  /images/{target}  {size[0]}x{size[1]}')

    print('ramen')
    for source in RAMEN:
        target = os.path.splitext(source)[0] + '.webp'
        size = web_copy(os.path.join(ASSETS, source), os.path.join(SITE, 'images', 'ramen', target), RAMEN_EDGE)
        print(f'  /images/ramen/{target}  {size[0]}x{size[1]}')


def add(path, alt):
    if not os.path.isfile(path):
        sys.exit(f'No such file: {path}')
    if not alt.strip():
        sys.exit('Give the photo a description; it is the alt text.')
    file = os.path.basename(path)
    destination = os.path.join(ASSETS, file)
    if os.path.abspath(path) != os.path.abspath(destination):
        if os.path.exists(destination):
            sys.exit(f'main-site/assets/{file} already exists; rename the photo first.')
        shutil.copy2(path, destination)

    photos = load_photos()
    if any(entry['file'] == file for entry in photos):
        sys.exit(f'{file} is already in photos.json.')
    entry = {'file': file, 'alt': alt.strip()}
    build_gallery_entry(entry)
    photos.append(entry)
    save_photos(photos)
    print(f'Added {file}. The gallery now has {len(photos)} photos.')


if __name__ == '__main__':
    if len(sys.argv) >= 2 and sys.argv[1] == 'build':
        build()
    elif len(sys.argv) == 4 and sys.argv[1] == 'add':
        add(sys.argv[2], sys.argv[3])
    else:
        sys.exit('usage: python tools/photos.py build\n'
                 '       python tools/photos.py add path/to/photo.jpg "What the photo shows"')
