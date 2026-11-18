"""Clean Higgsfield pixel-art concepts into game sprites.
clean(path, height) -> RGBA numpy array whose character is `height` px tall (tight crop).
Steps: find the character on the teal, choose the cell size so it comes out `height` tall,
take the most common colour of each cell, snap to a shared palette, outline, drop lone pixels."""
import numpy as np
from PIL import Image

OUTLINE = np.array([0x15, 0x0b, 0x22])

def load(path):
    a = np.array(Image.open(path).convert('RGB')).astype(int)
    bg = np.median(np.concatenate([a[0], a[-1], a[:, 0], a[:, -1]]), axis=0)
    fg = np.abs(a - bg).sum(2) > 70
    # drop small specks (noise) by keeping rows/cols with real content
    ys, xs = np.where(fg)
    return a, fg, bg, (ys.min(), ys.max() + 1, xs.min(), xs.max() + 1)

def cells(a, fg, box, height):
    y0, y1, x0, x1 = box
    p = (y1 - y0) / height
    w = int(round((x1 - x0) / p))
    out = np.zeros((height, w, 4), int)
    for j in range(height):
        for i in range(w):
            ya, yb = int(y0 + j * p), int(y0 + (j + 1) * p)
            xa, xb = int(x0 + i * p), int(x0 + (i + 1) * p)
            # inner 60% of the cell
            my, mx = max(1, (yb - ya) // 5), max(1, (xb - xa) // 5)
            c = a[ya + my:yb - my, xa + mx:xb - mx].reshape(-1, 3)
            f = fg[ya + my:yb - my, xa + mx:xb - mx].reshape(-1)
            if f.mean() < 0.5:
                continue
            c = c[f]
            q = (c // 12)
            keys, inv, cnt = np.unique(q, axis=0, return_inverse=True, return_counts=True)
            k = cnt.argmax()
            out[j, i, :3] = c[inv.reshape(-1) == k].mean(0)
            out[j, i, 3] = 255
    return out

def palette(arrays, n=22):
    px = np.concatenate([a[a[..., 3] > 0][:, :3] for a in arrays]).astype(np.uint8)
    im = Image.fromarray(px.reshape(1, -1, 3), 'RGB').quantize(n, method=Image.Quantize.MAXCOVERAGE)
    pal = np.array(im.getpalette()[:n * 3]).reshape(-1, 3)
    return pal

def snap(rgba, pal):
    m = rgba[..., 3] > 0
    c = rgba[m][:, :3]
    idx = ((c[:, None] - pal[None]) ** 2).sum(2).argmin(1)
    rgba[m, :3] = pal[idx]
    return rgba

def tidy(rgba):
    s = rgba[..., 3] > 0
    # lone pixels: solid with <=1 solid 4-neighbours -> clear; holes with 4 solid neighbours -> fill dark
    p = np.pad(s, 1)
    nb = p[:-2, 1:-1].astype(int) + p[2:, 1:-1] + p[1:-1, :-2] + p[1:-1, 2:]
    rgba[s & (nb <= 1), 3] = 0
    s = rgba[..., 3] > 0
    p = np.pad(s, 1)
    edge = s & ~(p[:-2, 1:-1] & p[2:, 1:-1] & p[1:-1, :-2] & p[1:-1, 2:])
    rgba[edge, :3] = OUTLINE
    # very dark pixels become the outline colour too
    dark = (rgba[..., :3].sum(2) < 90) & s
    rgba[dark, :3] = OUTLINE
    return rgba

def crop(rgba):
    ys, xs = np.where(rgba[..., 3] > 0)
    return rgba[ys.min():ys.max() + 1, xs.min():xs.max() + 1]

def place(rgba, w, h, anchor='bottom'):
    """Centre on a w x h canvas, feet on the bottom row."""
    out = np.zeros((h, w, 4), int)
    sh, sw = rgba.shape[:2]
    if sw > w or sh > h:
        raise ValueError(f'{sw}x{sh} does not fit {w}x{h}')
    x = (w - sw) // 2
    out[h - sh:, x:x + sw] = rgba
    return out

def save(rgba, path):
    Image.fromarray(rgba.astype(np.uint8), 'RGBA').save(path)

def main_shape(rgba, keep=0.15):
    """Drop loose bits (a thrown prop floating free, specks): keep the biggest connected shape
    and anything at least `keep` times its size."""
    s = rgba[..., 3] > 0
    lab = np.zeros(s.shape, int)
    sizes = []
    h, w = s.shape
    for y0, x0 in zip(*np.where(s)):
        if lab[y0, x0]:
            continue
        n = len(sizes) + 1
        stack, count = [(y0, x0)], 0
        lab[y0, x0] = n
        while stack:
            y, x = stack.pop()
            count += 1
            for dy in (-1, 0, 1):
                for dx in (-1, 0, 1):
                    ny, nx = y + dy, x + dx
                    if 0 <= ny < h and 0 <= nx < w and s[ny, nx] and not lab[ny, nx]:
                        lab[ny, nx] = n
                        stack.append((ny, nx))
        sizes.append(count)
    if len(sizes) > 1:
        big = max(sizes)
        for i, c in enumerate(sizes, 1):
            if c < keep * big:
                rgba[lab == i, 3] = 0
    return rgba
