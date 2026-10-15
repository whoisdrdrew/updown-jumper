"""Draws the burger power-up: a red and yellow burger box that pops open and a double burger that makes Boris big.

Same rules as world_art.py: the hero's pixel size, #150b22 outline, 3-step ramps lit from the top left.
Items are about a third to half of the hero's height, like the egg (26 x 30).

Outputs (default /mnt/project-files/art/powerups, or the folder given as the first argument):
  burger-box.png       the closed box, sits where the egg sits (30 x 26)
  burger-box-lid.png   the lid that flips off when the box opens
  burger-box-base.png  the bottom half that stays behind
  burger.png           the double burger that comes out (26 x 25)

Run from the repo root:  python3 tools/powerup_art.py [out_dir]   (needs Pillow and numpy)
"""
import os
import sys
import numpy as np
from pixelkit import Canvas, OUTLINE, rgb

RED = ['#6a0a20', '#a81a2a', '#d8303a', '#f05a5a']
YELLOW = ['#9a5a10', '#e0931a', '#f7ce12', '#fae8bf']
BUN = ['#7a3a10', '#b8642a', '#e08a50', '#f2b07a']
PATTY = ['#2a120e', '#4a2416', '#6a3a20']
CHEESE = ['#e0931a', '#f7ce12']
LETTUCE = ['#1e5a2e', '#3cae4a', '#8ad860']
SESAME = '#fae8bf'


def put(c, mask, col):
    c.a[mask] = rgb(col) + [255]


def box_shape(w, h):
    """A clamshell box seen from the front: a lid with a rounded top over a straight base."""
    ys, xs = np.mgrid[0:h, 0:w]
    lid_h = h // 2
    lid = (ys < lid_h) & (xs >= 1 + (lid_h - ys) // 4) & (xs < w - 1 - (lid_h - ys) // 4) & (ys >= 1)
    base = (ys >= lid_h) & (ys < h - 1) & (xs >= 2 + (ys - lid_h) // 5) & (xs < w - 2 - (ys - lid_h) // 5)
    return lid, base


def paint_box(c, lid, base, ox=0, oy=0):
    h, w = lid.shape
    ys, xs = np.mgrid[0:h, 0:w]
    for m, top in ((lid, 1), (base, h // 2)):
        t = (xs / w) * 0.6 + ((ys - top) / (h / 2)) * 0.4
        idx = np.clip((t * 3).astype(int), 0, 2)
        for i, col in enumerate([RED[3], RED[2], RED[1]]):
            put(c, m & (idx == i), col)
    # Yellow band along the seam and a yellow arch-free burger icon on the lid.
    seam = h // 2
    put(c, (lid | base) & (ys >= seam - 2) & (ys < seam + 1), YELLOW[2])
    put(c, (lid | base) & (ys == seam - 2), YELLOW[3])
    put(c, (lid | base) & (ys == seam), YELLOW[1])
    cx = w // 2
    icon = ((ys == seam - 7) & (np.abs(xs - cx) <= 3)) | ((ys == seam - 8) & (np.abs(xs - cx) <= 2)) \
        | ((ys == seam - 5) & (np.abs(xs - cx) <= 3)) | ((ys == seam - 4) & (np.abs(xs - cx) <= 3))
    put(c, icon & lid, YELLOW[2])
    put(c, (ys == seam - 6) & (np.abs(xs - cx) <= 3) & lid, YELLOW[0])
    put(c, base & (ys == h - 4), YELLOW[2])                                        # stripe on the base
    put(c, base & (ys == h - 3), YELLOW[1])
    put(c, lid & (ys == 1) | lid & (xs == 1 + (h // 2 - ys) // 4), RED[3])       # top-left light


def outlined(c):
    s = c.a[..., 3] > 0
    p = np.pad(s, 1)
    n = p[:-2, 1:-1] | p[2:, 1:-1] | p[1:-1, :-2] | p[1:-1, 2:]
    put(c, ~s & n, OUTLINE)
    return c


def burger_box():
    w, h = 30, 26
    c = Canvas(w, h)
    lid, base = box_shape(w, h)
    paint_box(c, lid, base)
    put(c, np.mgrid[0:h, 0:w][0] == h // 2 + 1, RED[0])             # seam shadow
    c.a[(c.a[..., 3] > 0) & ~(lid | base)] = 0
    outlined(c)
    # Two halves for the pop: the lid flips off, the base stays.
    lc, bc = Canvas(w, h // 2 + 2), Canvas(w, h - h // 2 + 1)
    lc.a[1:h // 2 + 1] = c.a[0:h // 2]
    bc.a[0:h - h // 2] = c.a[h // 2:h]
    for part in (lc, bc):
        part.a[..., 3] = np.where(part.a[..., 3] > 0, 255, 0)
        part.a[(part.a[..., :3] == rgb(OUTLINE)).all(-1)] = 0
        outlined(part)
    return c, lc, bc


def burger():
    """A double burger: sesame bun, lettuce, cheese, patty, middle bun, cheese, patty, bottom bun."""
    w, h = 26, 25
    c = Canvas(w, h)

    def slab(y, rows, ramp, insets):
        """Rows of a layer; each row has its own inset so the ends round off. Lit from the top left."""
        for r, inset in enumerate(insets):
            x0, x1 = 1 + inset, w - 1 - inset
            for x in range(x0, x1):
                t = r / max(1, rows - 1) * 0.65 + (x - x0) / (x1 - x0) * 0.35
                c.px(x, y + r, ramp[::-1][min(len(ramp) - 1, int(t * len(ramp)))])

    # Top bun: a dome, highlight on the top left.
    slab(1, 8, BUN, [7, 4, 2, 1, 0, 0, 0, 0])
    c.rect(7, 2, 5, 1, BUN[3]); c.rect(5, 3, 3, 1, BUN[3])
    for sx, sy in ((9, 3), (14, 2), (18, 4), (6, 5), (12, 5), (16, 6), (21, 6)):
        c.px(sx, sy, SESAME)
    # Lettuce: wavy, wider than the bun.
    for x in range(0, w):
        c.px(x, 9, LETTUCE[1] if x % 4 else LETTUCE[2])
        if x % 4 in (1, 2):
            c.px(x, 10, LETTUCE[0])
    # Cheese with triangle drips over the first patty.
    c.rect(1, 10, w - 2, 1, CHEESE[1])
    for x in (3, 10, 17, 22):
        c.rect(x, 11, 2, 1, CHEESE[1]); c.px(x, 12, CHEESE[0])
    slab(11, 3, PATTY, [1, 0, 1])
    for x in (3, 10, 17, 22):
        c.rect(x, 11, 2, 1, CHEESE[1]); c.px(x, 12, CHEESE[0])
    # Middle bun.
    slab(14, 2, BUN[1:], [1, 1])
    # Second cheese and patty.
    c.rect(2, 16, w - 4, 1, CHEESE[1])
    for x in (6, 14, 20):
        c.px(x, 17, CHEESE[0])
    slab(17, 3, PATTY, [1, 0, 1])
    for x in (6, 14, 20):
        c.px(x, 17, CHEESE[1])
    # Bottom bun with rounded bottom corners.
    slab(20, 4, BUN[:3], [0, 0, 1, 3])
    c.rect(3, 20, w - 8, 1, BUN[2])
    outlined(c)
    return c


def main():
    out = sys.argv[1] if len(sys.argv) > 1 else '/mnt/project-files/art/powerups'
    os.makedirs(out, exist_ok=True)
    box, lid, base = burger_box()
    box.save(os.path.join(out, 'burger-box.png'))
    lid.save(os.path.join(out, 'burger-box-lid.png'))
    base.save(os.path.join(out, 'burger-box-base.png'))
    burger().save(os.path.join(out, 'burger.png'))
    print('saved to', out)


if __name__ == '__main__':
    main()
