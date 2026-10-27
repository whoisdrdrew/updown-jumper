"""Draws the phone app icons: the hero mid-jump over a gold-rimmed brick ledge on the club's purple sky.

The icon is drawn as a small pixel picture and blown up with hard edges, so it stays crisp on the
home screen. Writes into public/icons/ (served at the site root next to the game).

Run from the repo root:  python3 tools/app_icon.py   (needs Pillow)
"""
import os
from PIL import Image

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
OUT = os.path.join(ROOT, 'public', 'icons')
HERO = Image.open(os.path.join(ROOT, 'src', 'art', 'hero', 'jump.png')).convert('RGBA')

SKY = ['#12081c', '#1b0d2c', '#24123e', '#341a52', '#4a2266']  # top .. horizon
GOLD = ['#e0931a', '#f7ce12']
STONE = ['#3a261c', '#8a6a50', '#b08a64']
OUTLINE = '#150b22'


def rgb(h):
    return tuple(int(h[i:i + 2], 16) for i in (1, 3, 5)) + (255,)


def scene(size, ground):
    """A size x size pixel picture with the hero centred above a ledge `ground` pixels tall."""
    im = Image.new('RGBA', (size, size))
    px = im.load()
    for y in range(size):
        band = SKY[min(len(SKY) - 1, y * len(SKY) // size)]
        for x in range(size):
            px[x, y] = rgb(band)
    # A few stars.
    for sx, sy in ((0.18, 0.14), (0.8, 0.2), (0.66, 0.08), (0.3, 0.32), (0.88, 0.42)):
        px[int(sx * size), int(sy * size)] = rgb('#ffe680')
    top = size - ground
    for y in range(top, size):
        for x in range(size):
            if y == top:
                c = OUTLINE
            elif y <= top + 2:
                c = GOLD[1] if y == top + 1 else GOLD[0]
            else:
                row = (y - top - 3) // 4
                mortar = (y - top - 3) % 4 == 3 or (x + row * 4) % 8 == 0
                c = STONE[0] if mortar else STONE[1 + (x + y) % 2 * 0]
            px[x, y] = rgb(c)
    hero = HERO.crop(HERO.getbbox())
    hx = (size - hero.width) // 2
    hy = top - hero.height - max(2, size // 16)  # in the air, mid-jump
    im.alpha_composite(hero, (hx, hy))
    return im


def save(im, scale, name, final=None):
    big = im.resize((im.width * scale, im.height * scale), Image.NEAREST)
    if final and final != big.width:
        # Trim the edges evenly (sky and ledge only) to hit an exact size.
        cut = (big.width - final) // 2
        big = big.crop((cut, cut, cut + final, cut + final))
    big.convert('RGB').save(os.path.join(OUT, name))


os.makedirs(OUT, exist_ok=True)
icon = scene(64, 12)
save(icon, 8, 'icon-512.png')
save(icon, 3, 'icon-192.png')
save(icon, 3, 'apple-touch-icon.png', final=180)
save(icon, 1, 'favicon-64.png')
# Android cuts maskable icons to a circle or squircle: more sky around the hero keeps it inside.
save(scene(85, 15), 6, 'icon-maskable-512.png', final=None)
mask = Image.open(os.path.join(OUT, 'icon-maskable-512.png'))
padded = Image.new('RGB', (512, 512), rgb(SKY[0])[:3])
padded.paste(mask, (1, 1))
padded.save(os.path.join(OUT, 'icon-maskable-512.png'))
print('wrote', sorted(os.listdir(OUT)))
