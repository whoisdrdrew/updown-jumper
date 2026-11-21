"""Snapper (Fisher) world: the moving sea, from two Higgsfield sprite sheets on magenta.
python3 tools/hf_wave.py <wave-sheet.png> <dolphin-sheet.png>

wave-sheet: six wide strips of the same sea stacked top to bottom, one big wave going through
its cycle (calm, rises, curls, barrels, crashes, settles). Each strip becomes a full mid layer
picture src/art/world/snapper/wave-<n>.png (640x360, the strip's bottom on row 250 like the old
mid layer, the right edge mirrored in so it tiles, the wave moved SHIFT px right); 2-mid.png is wave-0.
dolphin-sheet: one row of 8 cells, a dolphin jumping out and diving back in, each over a strip of
water. The water is cut off (the dolphin's own pixels below the water line stay) and each cell
becomes src/art/world/snapper/dolphin-<n>.png, bottom = the water line.
Pictures: project files art/worlds/snapper/motion/."""
import sys, os
import numpy as np
from PIL import Image

OUT = os.path.join(os.path.dirname(__file__), '..', 'src', 'art', 'world', 'snapper')
W, H, BOTTOM = 640, 360, 250
SHIFT = 130  # move the big wave right, so it isn't hidden behind the patrol tower at the start
DOLPHIN_SCALE = 0.4


def keyed(path):
    a = np.array(Image.open(path).convert('RGBA')).astype(int)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    # magenta and its pink fringe: red and blue well above green
    mag = (r - g > 90) & (b - g > 90)
    a[..., 3] = np.where(mag, 0, 255)
    return a.astype(np.uint8), mag


def runs(counts, min_count):
    out, start = [], None
    for i, v in enumerate(list(counts) + [0]):
        if v > min_count and start is None:
            start = i
        elif v <= min_count and start is not None:
            out.append((start, i))
            start = None
    return out


def tile_edge(im):
    # the right 30% becomes the left 30% mirrored, softly joined, so the band tiles sideways
    e = round(W * 0.3)
    flip = im.crop((0, 0, e, im.height)).transpose(Image.FLIP_LEFT_RIGHT)
    right = im.crop((W - e, 0, W, im.height))
    mask = Image.new('L', (e, im.height))
    for x in range(e):
        mask.paste(min(255, round(255 * x / 32)), (x, 0, x + 1, im.height))
    im.paste(Image.composite(flip, right, mask), (W - e, 0))
    return im


def waves(path):
    a, mag = keyed(path)
    strips = runs((~mag).sum(1), 20)
    assert len(strips) == 6, strips
    for n, (top, bottom) in enumerate(strips):
        strip = Image.fromarray(a[top:bottom])
        k = W / strip.width
        strip = strip.resize((W, round(strip.height * k)), Image.BOX)
        layer = Image.new('RGBA', (W, H))
        layer.alpha_composite(strip, (0, BOTTOM - strip.height))
        layer = tile_edge(layer)
        layer = Image.fromarray(np.roll(np.array(layer), SHIFT, axis=1))
        layer.save(os.path.join(OUT, f'wave-{n}.png'))
        if n == 0:
            layer.save(os.path.join(OUT, '2-mid.png'))
        print('wave', n, strip.size)


def dolphins(path):
    a, mag = keyed(path)
    cells = runs((~mag).sum(0), 0)
    assert len(cells) == 8, cells
    # the water line: the first row where the last cell (only splash and water) is mostly water
    last = cells[-1]
    water = next(y for y in range(a.shape[0]) if (~mag[y, last[0]:last[1]]).sum() > 0.6 * (last[1] - last[0]))
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    grey = (abs(r - g) < 40) & (b - r < 70) & (r < 200)  # dolphin body, not teal water or foam
    below = np.zeros_like(mag)
    below[water + 2:] = True
    a[..., 3] = np.where(below & ~grey, 0, a[..., 3])
    rows = (a[..., 3] > 0).sum(1).nonzero()[0]
    top = rows[0]
    cell_w = max(c[1] - c[0] for c in cells)
    for n, (x0, x1) in enumerate(cells):
        cx = (x0 + x1) // 2
        cell = Image.fromarray(a[top:water + 6, cx - cell_w // 2: cx + cell_w // 2])
        size = (round(cell.width * DOLPHIN_SCALE), round(cell.height * DOLPHIN_SCALE))
        cell.resize(size, Image.BOX).save(os.path.join(OUT, f'dolphin-{n}.png'))
    print('dolphins', len(cells), size)


waves(sys.argv[1])
dolphins(sys.argv[2])
