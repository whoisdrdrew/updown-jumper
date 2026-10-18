"""Boris's new outfit on every sprite of him: black shirt, grey trousers with a yellow stripe down the
outer side of each leg, and a necklace of little yellow rubber ducks under the chin (Sandro's reference).

Works on the finished sprites, so the poses stay exactly as they are:
  - the shirt is the biggest patch of shirt colours below the head; it is recoloured to a black ramp,
  - the trousers are the patches of jeans colours below the shirt; recoloured to a grey ramp, and the
    outermost trouser pixel of each leg in every row becomes the yellow stripe,
  - the necklace runs along the top of the shirt under the chin: duck, duck, beak, ...

Run from the repo root:  python3 tools/outfit.py in_dir out_dir   (every .png under in_dir, same tree in out_dir)
Sprites lying down (boris-sleep) and the portraits are handled too; check preview-outfit.png.
"""
import os
import sys
from collections import deque
import numpy as np
from PIL import Image

def hexrgb(c):
    return (int(c[1:3], 16), int(c[3:5], 16), int(c[5:7], 16))

SHIRT_OLD = {'#452c3b': 'main', '#30233f': 'shade', '#221533': 'deep', '#54455c': 'lit'}
JEANS_OLD = {'#354169': 'main', '#54455c': 'lit', '#200920': 'deep', '#30233f': 'shade', '#221533': 'deep'}
SHIRT_NEW = {'lit': '#3e3b46', 'main': '#2a2731', 'shade': '#201d26', 'deep': '#18151d'}
PANTS_NEW = {'lit': '#a6a5b0', 'main': '#868591', 'shade': '#64636e', 'deep': '#4a4954'}
STRIPE = '#f7ce12'
STRIPE_SHADE = '#e0931a'
DUCK = '#f7ce12'
DUCK_LIT = '#fae8bf'
BEAK = '#e0931a'

SHIRT_SET = {hexrgb(c) for c in ('#452c3b', '#30233f', '#221533')}
JEANS_SET = {hexrgb(c) for c in ('#354169', '#200920', '#54455c', '#30233f', '#221533')}
JEANS_SEED = hexrgb('#354169')
SHIRT_SEED = hexrgb('#452c3b')


def components(mask):
    lab = np.zeros(mask.shape, int); n = 0; h, w = mask.shape
    for y0, x0 in zip(*np.where(mask)):
        if lab[y0, x0]:
            continue
        n += 1; q = deque([(y0, x0)]); lab[y0, x0] = n
        while q:
            y, x = q.popleft()
            for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                ny, nx = y + dy, x + dx
                if 0 <= ny < h and 0 <= nx < w and mask[ny, nx] and not lab[ny, nx]:
                    lab[ny, nx] = n; q.append((ny, nx))
    return lab, n


def colour_mask(a, cols):
    rgb = a[..., :3]; m = np.zeros(a.shape[:2], bool)
    for c in cols:
        m |= (rgb == c).all(2)
    return m & (a[..., 3] > 0)


def dress(a):
    a = a.copy()
    h, w = a.shape[:2]
    is_seed_j = colour_mask(a, [JEANS_SEED])
    # Trousers: patches of jeans colours holding a good amount of the main denim colour.
    jl, jn = components(colour_mask(a, JEANS_SET))
    pants = np.zeros((h, w), bool)
    for i in range(1, jn + 1):
        m = jl == i
        if (m & is_seed_j).sum() >= 6:
            pants |= m
    # Shirt: the biggest patch of shirt colours (not trousers), plus sleeves touching its rows.
    sl, sn = components(colour_mask(a, SHIRT_SET) & ~pants)
    sizes = [(sl == i).sum() for i in range(1, sn + 1)]
    shirt = np.zeros((h, w), bool)
    if sizes:
        big = int(np.argmax(sizes)) + 1
        shirt = sl == big
        ys = np.where(shirt.any(1))[0]
        for i in range(1, sn + 1):
            m = sl == i
            my = np.where(m.any(1))[0]
            if i != big and m.sum() >= 4 and my.min() >= ys.min() - 2 and my.max() <= ys.max() + 2 \
                    and (m & colour_mask(a, [SHIRT_SEED])).any():
                shirt |= m
    if pants.any() and shirt.any():
        # Drop "trouser" patches that sit above the shirt (bits of the mask).
        top = np.where(shirt.any(1))[0].min()
        pl, pn = components(pants)
        for i in range(1, pn + 1):
            m = pl == i
            if np.where(m.any(1))[0].mean() < top + 2:
                pants &= ~m
    for old, role in SHIRT_OLD.items():
        a[shirt & colour_mask(a, [hexrgb(old)])] = list(hexrgb(SHIRT_NEW[role])) + [255]
    for old, role in JEANS_OLD.items():
        a[pants & colour_mask(a, [hexrgb(old)])] = list(hexrgb(PANTS_NEW[role])) + [255]
    stripe(a, pants)
    if shirt.any():
        (necklace_lying if w > h * 1.6 else necklace)(a, shirt)
    return a


def stripe(a, pants):
    """The outer edge of each leg, every row: the left leg on its left, the right leg on its right."""
    ys = np.where(pants.any(1))[0]
    if not len(ys):
        return
    xs = np.where(pants.any(0))[0]; mid = (xs.min() + xs.max()) / 2
    top = ys.min()
    for y in ys:
        if y < top + 1:
            continue                      # leave the waistband plain
        row = pants[y]; x = 0; w = len(row)
        while x < w:
            if not row[x]:
                x += 1; continue
            x1 = x
            while x1 < w and row[x1]:
                x1 += 1
            run = (x, x1 - 1)             # pants pixels x .. x1-1
            near_shoe = any(0 <= y + 1 < a.shape[0] and (a[y + 1, xx, :3] == hexrgb('#fdfefd')).all() for xx in run)
            if run[1] - run[0] >= 2 and not near_shoe:
                if (run[0] + run[1]) / 2 <= mid or run[1] - run[0] > (xs.max() - xs.min()) * 0.6:
                    a[y, run[0]] = list(hexrgb(STRIPE)) + [255]
                if (run[0] + run[1]) / 2 > mid or run[1] - run[0] > (xs.max() - xs.min()) * 0.6:
                    a[y, run[1]] = list(hexrgb(STRIPE_SHADE)) + [255]
            x = x1


def necklace(a, shirt):
    """Little ducks along the top edge of the shirt, under the chin."""
    h, w = shirt.shape
    ys, xs = np.where(shirt)
    rows = shirt.sum(1)
    full = np.where(rows >= 0.55 * rows.max())[0]
    cut = full[0]
    band = np.where(shirt[cut:cut + 3].any(0))[0]
    cx = (band.min() + band.max()) / 2
    span = max(4, int(round((band.max() - band.min()) * 0.28)))
    pts = []
    for x in range(int(round(cx - span)), int(round(cx + span)) + 1):
        col = np.where(shirt[:, x])[0] if 0 <= x < w else []
        col = [y for y in col if y >= cut - 6]
        if not len(col):
            continue
        y = col[0]
        # A gentle U: one row lower in the middle.
        if abs(x - cx) < span * 0.5:
            y += 1
        if y < h and shirt[y, x]:
            pts.append((y, x))
    # Each duck is three columns: a yellow body two pixels tall, a lit head, an orange beak.
    for i, (y, x) in enumerate(pts):
        k = i % 3
        if k == 2:
            a[y, x] = list(hexrgb(BEAK)) + [255]
            continue
        a[y, x] = list(hexrgb(DUCK_LIT if k == 1 else DUCK)) + [255]
        if y + 1 < h and shirt[y + 1, x]:
            a[y + 1, x] = list(hexrgb(DUCK)) + [255]


def necklace_lying(a, shirt):
    """Lying down (head on the left): the ducks run down the shirt's edge next to the head."""
    h, w = shirt.shape
    cols = np.where(shirt.any(0))[0]
    x0 = cols.min()
    ys = np.where(shirt[:, x0:x0 + 3].any(1))[0]
    for i, y in enumerate(range(ys.min(), ys.max() + 1)):
        xs = np.where(shirt[y])[0]
        if not len(xs):
            continue
        x = xs[0]; k = i % 3
        a[y, x] = list(hexrgb(BEAK if k == 2 else DUCK_LIT if k == 1 else DUCK)) + [255]
        if k != 2 and x + 1 < w and shirt[y, x + 1]:
            a[y, x + 1] = list(hexrgb(DUCK)) + [255]


def main():
    src, dst = sys.argv[1], sys.argv[2]
    for root, _, files in os.walk(src):
        for f in files:
            if not f.endswith('.png'):
                continue
            p = os.path.join(root, f)
            a = np.array(Image.open(p).convert('RGBA')).astype(int)
            out = dress(a)
            q = os.path.join(dst, os.path.relpath(p, src))
            os.makedirs(os.path.dirname(q), exist_ok=True)
            Image.fromarray(out.astype(np.uint8)).save(q)
    print('saved to', dst)


if __name__ == '__main__':
    main()
