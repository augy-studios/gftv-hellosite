# Adding a photo to the HelloSpot gallery.
#
# The gallery shows the photos listed in main-site/photos.json, in order, each
# straight from its original in main-site/assets/ (no resized copies). The page
# fetches each one and shows it through a blob: URL (js/blob-images.js).
#
# Usage, from the repo root:
#
#   python tools/photos.py add path/to/photo.jpg "Caption"
#       Copy the photo into main-site/assets/ (if it is not there already) and
#       add it to the end of photos.json with that caption. The caption is
#       shown under the photo and is its alt text, so name what is in it.
#
#   python tools/photos.py refresh
#       Re-read every listed photo's size, after replacing a file in assets/.
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


def load_photos():
    with open(PHOTOS_JSON, encoding='utf-8') as handle:
        return json.load(handle)


def save_photos(photos):
    with open(PHOTOS_JSON, 'w', encoding='utf-8', newline='\n') as handle:
        json.dump(photos, handle, ensure_ascii=False, indent=2)
        handle.write('\n')


def describe(entry):
    """Fill in the entry's address and its upright size. The page sizes each
    frame from these before the picture arrives."""
    with Image.open(os.path.join(ASSETS, entry['file'])) as image:
        width, height = ImageOps.exif_transpose(image).size
    entry['src'] = '/assets/' + entry['file']
    entry['width'] = width
    entry['height'] = height


def add(path, caption):
    if not os.path.isfile(path):
        sys.exit(f'No such file: {path}')
    if not caption.strip():
        sys.exit('Give the photo a caption; it is also its alt text.')
    file = os.path.basename(path)
    if ' ' in file:
        sys.exit('Rename the photo without spaces first, so its address stays simple.')
    destination = os.path.join(ASSETS, file)
    if os.path.abspath(path) != os.path.abspath(destination):
        if os.path.exists(destination):
            sys.exit(f'main-site/assets/{file} already exists; rename the photo first.')
        shutil.copy2(path, destination)

    photos = load_photos()
    if any(entry['file'] == file for entry in photos):
        sys.exit(f'{file} is already in photos.json.')
    entry = {'file': file, 'alt': caption.strip()}
    describe(entry)
    photos.append(entry)
    save_photos(photos)
    print(f'Added {file} ({entry["width"]}x{entry["height"]}). The gallery now has {len(photos)} photos.')


def refresh():
    photos = load_photos()
    for entry in photos:
        describe(entry)
        print(f'  {entry["src"]}  {entry["width"]}x{entry["height"]}')
    save_photos(photos)


if __name__ == '__main__':
    if len(sys.argv) == 2 and sys.argv[1] == 'refresh':
        refresh()
    elif len(sys.argv) == 4 and sys.argv[1] == 'add':
        add(sys.argv[2], sys.argv[3])
    else:
        sys.exit('usage: python tools/photos.py add path/to/photo.jpg "Caption"\n'
                 '       python tools/photos.py refresh')
