"""Build one DJ's game pictures from cleaned Higgsfield concepts.
The boss walking picture (walk.png) is made after, by tools/hf_boss_walk.py.
python3 build_dj.py <concept dir with idle,run,jump,sit,attack,defeat,photo,portrait .png> <repo> <id>"""
import sys, os, numpy as np
from PIL import Image
sys.path.insert(0, os.path.dirname(__file__))
from hf_clean import load, cells, palette, snap, tidy, crop, save, main_shape

SRC, REPO, ID = sys.argv[1:4]
NCOL = int(os.environ.get('NCOL', 32))
SMALL_H, BIG_H = int(os.environ.get('SMALL_H', 50)), int(os.environ.get('BIG_H', 64))
poses = ['idle', 'run', 'jump', 'sit', 'attack', 'defeat', 'photo']
L = {p: load(f'{SRC}/{p}.png') for p in poses}
idle_h = L['idle'][3][1] - L['idle'][3][0]

def head_w(p):
    """Width of the head in concept pixels: the widest row in the top 22% of the character."""
    a, fg, bg, box = L[p]
    y0, y1 = box[0], box[0] + int((L['idle'][3][1] - L['idle'][3][0]) * 0.22)
    rows = fg[y0:y1, box[2]:box[3]]
    return max((np.ptp(np.where(r)[0]) + 1) if r.any() else 0 for r in rows)

HEAD_FIX = os.environ.get('HEAD_FIX', '0') == '1'

def build(p, target):
    a, fg, bg, box = L[p]
    step = idle_h / target
    if HEAD_FIX:
        step *= head_w(p) / head_w('idle')
    return cells(a, fg, box, int(round((box[1] - box[0]) / step)))

small = {p: build(p, SMALL_H) for p in ['idle', 'run', 'jump', 'sit']}
big = {p: build(p, BIG_H) for p in poses}
pal = palette(list(small.values()) + list(big.values()), NCOL)
for d in (small, big):
    for p in d:
        d[p] = crop(main_shape(tidy(snap(d[p], pal))))

def head_x(r):
    """Centre of the head: middle of the solid pixels in the top quarter."""
    top = r[: max(4, r.shape[0] // 4), :, 3] > 0
    xs = np.where(top.any(0))[0]
    return (xs.min() + xs.max()) / 2

def canvas(r, w, h, cx=None, left=False):
    sh, sw = r.shape[:2]
    w, h = max(w, sw), max(h, sh)
    out = np.zeros((h, w, 4), int)
    if left:
        x = 0
    elif cx is None:
        x = (w - sw) // 2
    else:
        x = int(round(w / 2 - cx))
        x = min(max(x, 0), w - sw)
    out[h - sh:, x:x + sw] = r
    return out

def centred(r):
    """Canvas wide enough that the head sits in the middle (so poses don't jump when swapped)."""
    cx = head_x(r)
    half = int(np.ceil(max(cx + 1, r.shape[1] - cx)))
    return canvas(r, 2 * half, r.shape[0], cx)

art = f'{REPO}/src/art/{ID}'
for folder, d, size, sit in (('hero', small, (44, 52), (31, 50)), ('hero-big', big, (44, 66), (36, 64))):
    os.makedirs(f'{art}/playable/{folder}', exist_ok=True)
    for p in ['idle', 'run', 'jump']:
        out = canvas(d[p], *size, cx=head_x(d[p]))
        assert out.shape[:2] == (size[1], size[0]), (folder, p, d[p].shape)
        save(out, f'{art}/playable/{folder}/{p}.png')
    save(canvas(d['sit'], *sit, left=True), f'{art}/playable/{folder}/sit.png')
for p, name in (('idle', 'idle'), ('attack', 'attack'), ('defeat', 'defeat'), ('photo', 'photo-pose')):
    save(centred(big[p]), f'{art}/{name}.png')
# HUD / line-up face: top of the big idle, head centred, 37x30.
r = big['idle']
cx = int(round(head_x(r)))
face = np.zeros((30, 37, 4), int)
x0 = cx - 18
src = r[:30, max(0, x0):x0 + 37]
face[:src.shape[0], max(0, -x0):max(0, -x0) + src.shape[1]] = src
# close the cut at the bottom with the outline colour
face[29, face[29, :, 3] > 0, :3] = [0x15, 0x0b, 0x22]
save(face, f'{art}/portrait.png')
# Bonus room portrait, 288x224.
pim = Image.open(f'{SRC}/portrait.png').convert('RGB')
W, H = pim.size
cw = min(W, int(H * 288 / 224)); ch = int(cw * 224 / 288)
pim = pim.crop(((W - cw) // 2, (H - ch) // 2, (W - cw) // 2 + cw, (H - ch) // 2 + ch)).resize((288, 224), Image.BOX)
pim.quantize(48, method=Image.Quantize.MEDIANCUT).convert('RGB').save(f'{REPO}/src/art/bonus/portrait-{ID}.png')
for f in sorted(os.listdir(art)) + ['playable/hero/' + x for x in sorted(os.listdir(f'{art}/playable/hero'))] + ['playable/hero-big/' + x for x in sorted(os.listdir(f'{art}/playable/hero-big'))]:
    if f.endswith('.png'):
        print(f, Image.open(f'{art}/{f}').size)
