"""A playable DJ on Boris's frame: every Boris walking sprite (idle, run, jump, sit; small and big)
gets the DJ's head and colours, so the DJ moves exactly like Boris (Sandro: same moves, only the look differs).

How:
  - the DJ's head is cut from one of their front-facing boss sprites (rows HEAD_ROWS, cols HEAD_COLS),
    flipped to face right like Boris, and pasted so its chin sits where Boris's chin was,
  - everything of Boris above his shirt is removed first,
  - shirt, trousers and skin are recoloured ramp to ramp; the duck necklace and the trouser stripe go.

Run from the repo root:  python3 tools/dj_sprite.py solomun boris_sprite_dir boss_sprite out_dir
  boris_sprite_dir holds hero-bare/ and hero-big-bare/ (the no-mask sprites).
"""
import os
import sys
from collections import Counter
import numpy as np
from PIL import Image

def hexrgb(c):
    return (int(c[1:3], 16), int(c[3:5], 16), int(c[5:7], 16))

DJS = {
    'solomun': dict(
        head_rows=(0, 22), head_cols=(8, 38),
        # Colours inside the head box that belong to the shirt or the raised arm, not the head.
        not_head=['#33303b', '#27252d', '#25222c', '#1b1920', '#555160', '#a396a6', '#8e8790', '#746f7e'],
        shirt={'#3e3b46': '#555160', '#2a2731': '#33303b', '#201d26': '#27252d', '#18151d': '#1b1920'},
        pants={'#a6a5b0': '#3e3b46', '#868591': '#27252d', '#64636e': '#1f1d24', '#4a4954': '#18161c'},
        skin={'#f4cab8': '#f0a360', '#f1b9a3': '#f0a360', '#dc9983': '#d2905e', '#c1876c': '#c08a5a',
              '#9c6350': '#9a6440'},
        flip=True,
    ),
}
SHIRT_BORIS = ['#3e3b46', '#2a2731', '#201d26', '#18151d']
YELLOWS = ['#f7ce12', '#fae8bf', '#e0931a']
OUTLINE = hexrgb('#150b22')


def mask_of(a, cols):
    m = np.zeros(a.shape[:2], bool)
    for c in cols:
        m |= (a[..., :3] == hexrgb(c)).all(2)
    return m & (a[..., 3] > 0)


def cut_head(boss, d):
    y0, y1 = d['head_rows']; x0, x1 = d['head_cols']
    h = boss[y0:y1, x0:x1].copy()
    h[mask_of(h, d['not_head'])] = 0
    # Drop anything not connected to the main head blob (bits of the raised hand).
    from collections import deque
    m = h[..., 3] > 0; lab = np.zeros(m.shape, int); n = 0; sizes = {}
    for sy, sx in zip(*np.where(m)):
        if lab[sy, sx]:
            continue
        n += 1; q = deque([(sy, sx)]); lab[sy, sx] = n; k = 0
        while q:
            y, x = q.popleft(); k += 1
            for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                ny, nx = y + dy, x + dx
                if 0 <= ny < m.shape[0] and 0 <= nx < m.shape[1] and m[ny, nx] and not lab[ny, nx]:
                    lab[ny, nx] = n; q.append((ny, nx))
        sizes[n] = k
    big = max(sizes, key=sizes.get)
    h[lab != big] = 0
    if d['flip']:
        h = h[:, ::-1]
    ys, xs = np.where(h[..., 3] > 0)
    return h[ys.min():ys.max() + 1, xs.min():xs.max() + 1]


def recolour(a, table):
    out = a.copy()
    for old, new in table.items():
        out[mask_of(a, [old])] = list(hexrgb(new)) + [255]
    return out


def dress(a, head, d):
    a = a.copy()
    h, w = a.shape[:2]
    shirt = mask_of(a, SHIRT_BORIS + YELLOWS)
    rows = shirt.sum(1)
    cut = int(np.where(rows >= 4)[0][0])                 # top of the shirt: Boris's chin sits on it
    old = a[:cut + 1]
    bx = np.where(old[..., 3].any(0))[0]
    face_cx = (bx.min() + bx.max()) / 2
    # Yellow ducks and the trouser stripe take the colour of the cloth around them.
    for y, x in zip(*np.where(mask_of(a, YELLOWS))):
        nb = [tuple(a[yy, xx, :3]) for yy, xx in ((y, x - 1), (y, x + 1), (y - 1, x), (y + 1, x))
              if 0 <= yy < h and 0 <= xx < w and a[yy, xx, 3] and '#%02x%02x%02x' % tuple(a[yy, xx, :3]) not in YELLOWS
              and tuple(a[yy, xx, :3]) != OUTLINE]
        if nb:
            a[y, x, :3] = Counter(nb).most_common(1)[0][0]
    a = recolour(a, {**d['shirt'], **d['pants'], **d['skin']})
    a[:cut] = 0
    # Paste the head: chin on the shirt's top row, centred where Boris's head was.
    hh, hw = head.shape[:2]
    ty = cut + 1 - hh; tx = int(round(face_cx - hw / 2))
    pad = max(0, -ty)
    if pad:
        a = np.concatenate([np.zeros((pad, w, 4), a.dtype), a]); ty = 0
    for y in range(hh):
        for x in range(hw):
            if head[y, x, 3] and 0 <= tx + x < w:
                a[ty + y, tx + x] = head[y, x]
    return a[pad:] if pad else a, pad


def main():
    name, boris_dir, boss, out = sys.argv[1:5]
    d = DJS[name]
    head = cut_head(np.array(Image.open(boss).convert('RGBA')), d)
    for src, dst in (('hero-bare', 'hero'), ('hero-big-bare', 'hero-big')):
        os.makedirs(os.path.join(out, dst), exist_ok=True)
        for f in ('idle', 'run', 'jump', 'sit'):
            a = np.array(Image.open(os.path.join(boris_dir, src, f + '.png')).convert('RGBA'))
            r, pad = dress(a, head, d)
            if pad:
                print('warning: head sticks out above', src, f, 'by', pad)
            Image.fromarray(r).save(os.path.join(out, dst, f + '.png'))
    print('saved to', out)


if __name__ == '__main__':
    main()
