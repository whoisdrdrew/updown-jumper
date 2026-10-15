"""Tiny helpers for drawing pixel art into numpy RGBA arrays (used by world_art.py)."""
import numpy as np
from PIL import Image

OUTLINE = '#150b22'


def rgb(c):
    return [int(c[i:i + 2], 16) for i in (1, 3, 5)]


class Canvas:
    def __init__(self, w, h):
        self.w, self.h = w, h
        self.a = np.zeros((h, w, 4), np.uint8)

    def px(self, x, y, c):
        if 0 <= x < self.w and 0 <= y < self.h:
            self.a[y, x] = rgb(c) + [255]

    def rect(self, x, y, w, h, c):
        x0, y0, x1, y1 = max(0, x), max(0, y), min(self.w, x + w), min(self.h, y + h)
        if x1 > x0 and y1 > y0:
            self.a[y0:y1, x0:x1] = rgb(c) + [255]

    def ellipse_mask(self, cx, cy, rx, ry):
        ys, xs = np.mgrid[0:self.h, 0:self.w]
        return ((xs + .5 - cx) / rx) ** 2 + ((ys + .5 - cy) / ry) ** 2 <= 1

    def fill(self, mask, c):
        self.a[mask] = rgb(c) + [255]

    def shade(self, mask, cx, cy, rx, ry, ramp, light=(-0.6, -0.8), cuts=(-0.45, 0.05, 0.6)):
        """Fill a rounded shape with a ramp (dark..light), lit from the top left."""
        ys, xs = np.mgrid[0:self.h, 0:self.w]
        ox, oy = (xs + .5 - cx) / rx, (ys + .5 - cy) / ry
        s = ox * light[0] + oy * light[1]
        idx = np.digitize(s, cuts)  # 0..len(cuts)
        idx = np.clip(idx, 0, len(ramp) - 1)
        for i, c in enumerate(ramp):
            self.a[mask & (idx == i)] = rgb(c) + [255]

    def outline(self, c=OUTLINE, inside=False):
        """Outer outline around everything drawn (or turn the solid edge into outline if inside)."""
        s = self.a[..., 3] > 0
        p = np.pad(s, 1)
        n = p[:-2, 1:-1] | p[2:, 1:-1] | p[1:-1, :-2] | p[1:-1, 2:]
        if inside:
            edge = s & ~(p[:-2, 1:-1] & p[2:, 1:-1] & p[1:-1, :-2] & p[1:-1, 2:])
        else:
            edge = ~s & n
        self.a[edge] = rgb(c) + [255]

    def paste(self, other, x, y):
        m = other.a[..., 3] > 0
        ys, xs = np.where(m)
        for yy, xx in zip(ys, xs):
            if 0 <= x + xx < self.w and 0 <= y + yy < self.h:
                self.a[y + yy, x + xx] = other.a[yy, xx]

    def save(self, path):
        Image.fromarray(self.a, 'RGBA').save(path)
