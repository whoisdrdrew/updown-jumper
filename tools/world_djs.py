"""Draws the backdrops of the DJ worlds for levels 2-10 (one folder each in src/art/world/<world>/).

Same rules as world_solomun.py: drawn at the hero's pixel size (twice the world resolution, so
640x360 for the 320x180 view), #150b22 outline, lit from the top left, darker and lower in contrast
than the sprites, and every layer repeats seamlessly sideways (anything drawn near an edge is drawn
again one width over).

Each world has four layers, back to front, that the generic 'layers' builder in
src/art/background.js scrolls at the speeds in the world file (src/levels/worlds/<world>.js):
  0-sky.png   fixed sky (opaque)
  1-far.png   far landmarks (transparent)
  2-mid.png   the middle distance (transparent)
  3-near.png  close things at the bottom (transparent)

This is a first pass from Sandro's reference pictures (levels-input/<dj>/world/ in the project
files); a world can be redrawn by hand or with Higgsfield later without touching any gameplay.

Run from the repo root:  python3 tools/world_djs.py [world ...]   (needs Pillow and numpy)
"""
import math
import os
import sys
import numpy as np
from PIL import Image

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
OUT = os.path.join(ROOT, 'src', 'art', 'world')
W, H = 640, 360
OUTLINE = '#150b22'
GROUND = 264  # the ground tiles cover the picture from about here down (3 tile rows of 32)


def rgb(c):
    return np.array([int(c[i:i + 2], 16) for i in (1, 3, 5)], np.uint8)


def mix(a, b, t):
    a, b = rgb(a).astype(float), rgb(b).astype(float)
    v = a + (b - a) * t
    return '#%02x%02x%02x' % tuple(int(round(x)) for x in v)


YS, XS = np.mgrid[0:H, 0:W]
BAYER = np.tile(np.array([[0.125, 0.625], [0.875, 0.375]]), (H // 2, W // 2))


class Layer:
    def __init__(self, opaque=False):
        self.a = np.zeros((H, W, 4), np.uint8)
        if opaque:
            self.a[..., 3] = 255

    def fill(self, mask, c, alpha=255):
        self.a[mask, :3] = rgb(c)
        self.a[mask, 3] = alpha

    def rect(self, x, y, w, h, c, wrap=True):
        for dx in ((-W, 0, W) if wrap else (0,)):
            x0, x1 = max(0, x + dx), min(W, x + dx + w)
            y0, y1 = max(0, y), min(H, y + h)
            if x1 > x0 and y1 > y0:
                self.a[y0:y1, x0:x1, :3] = rgb(c)
                self.a[y0:y1, x0:x1, 3] = 255

    def px(self, x, y, c):
        x %= W
        if 0 <= y < H:
            self.a[y, x, :3] = rgb(c)
            self.a[y, x, 3] = 255

    def outline(self, c=OUTLINE):
        s = self.a[..., 3] > 0
        p = np.pad(s, ((1, 1), (0, 0)))
        left, right = np.roll(s, 1, 1), np.roll(s, -1, 1)  # wraps sideways like the layer
        n = p[:-2] | p[2:] | left | right
        edge = ~s & n
        self.fill(edge, c)

    def save(self, world, name):
        os.makedirs(os.path.join(OUT, world), exist_ok=True)
        Image.fromarray(self.a, 'RGBA').save(os.path.join(OUT, world, name))


def wrapdx(x):
    """Horizontal distance on the seamless strip."""
    d = (XS + 0.5 - x) % W
    return np.where(d > W / 2, d - W, d)


def ellipse(cx, cy, rx, ry):
    return (wrapdx(cx) / rx) ** 2 + ((YS + 0.5 - cy) / ry) ** 2 <= 1


def box(x, y, w, h):
    dx = (XS - x) % W
    return (dx < w) & (YS >= y) & (YS < y + h)


def tri(cx, top, half, base):
    """A triangle pointing up: apex (cx, top), base at y=base with half-width half."""
    t = (YS + 0.5 - top) / max(1, base - top)
    return (t >= 0) & (t <= 1) & (np.abs(wrapdx(cx)) <= half * t)


def sky(layer, stops):
    """Vertical gradient through (y, colour) stops with a 2x2 dither between bands."""
    ys = np.arange(H)
    for i in range(len(stops) - 1):
        (y0, c0), (y1, c1) = stops[i], stops[i + 1]
        band = (YS >= y0) & (YS < y1)
        steps = 4
        t = (YS + 0.5 - y0) / max(1, y1 - y0) * steps
        for k in range(steps):
            col = mix(c0, c1, k / steps)
            col2 = mix(c0, c1, (k + 1) / steps)
            m = band & (np.floor(t) == k)
            frac = t - k
            layer.fill(m & (BAYER >= frac), col)
            layer.fill(m & (BAYER < frac), col2)
    layer.fill(YS >= stops[-1][0], stops[-1][1])


def ridge(base, waves, seed=0):
    """A seamless skyline height: base minus a sum of sines with whole periods over W."""
    x = np.arange(W)
    h = np.zeros(W)
    for k, (period_count, amp) in enumerate(waves):
        h += amp * np.sin(2 * math.pi * period_count * x / W + seed * 1.7 + k)
    return base - h


def under(heights):
    return YS >= heights[None, :].astype(int)


def stars(layer, n, ymax, colors=('#cfd8ec', '#9a96b6'), seed=1):
    rng = np.random.default_rng(seed)
    for _ in range(n):
        layer.px(int(rng.integers(0, W)), int(rng.integers(0, ymax)), colors[int(rng.integers(0, len(colors)))])


def windows(layer, x, y, w, h, cols, rows, lit, dark, seed=0, gap=(3, 4)):
    rng = np.random.default_rng(seed)
    cw = max(2, (w - gap[0] * (cols + 1)) // cols)
    rh = max(2, (h - gap[1] * (rows + 1)) // rows)
    for r in range(rows):
        for c in range(cols):
            col = lit if rng.random() < 0.55 else dark
            layer.rect(x + gap[0] + c * (cw + gap[0]), y + gap[1] + r * (rh + gap[1]), cw, rh, col)


def palm(layer, x, base, height, trunk=('#2a140e', '#4e2a16'), leaf=('#123024', '#1f4a32')):
    for i in range(height):
        bend = int(4 * math.sin(i / height * 2.2))
        layer.rect(x + bend, base - i, 3, 1, trunk[0])
        layer.px(x + bend, base - i, trunk[1])
    tx = x + int(4 * math.sin(2.2)) + 1
    ty = base - height
    for ang in (-160, -120, -60, -20, 200, 90):
        a = math.radians(ang)
        for r in range(18):
            yy = ty + int(math.sin(a) * r * 0.6 + (r * r) * 0.03)
            xx = tx + int(math.cos(a) * r)
            layer.rect(xx, yy, 2, 2 if r < 14 else 1, leaf[0] if r % 3 else leaf[1])


def crowd(layer, y, colors, seed=3, arms=0.4, spacing=9):
    """A row of dancing heads and shoulders, some with hands up."""
    rng = np.random.default_rng(seed)
    x = 0
    while x < W:
        c = colors[int(rng.integers(0, len(colors)))]
        hy = y + int(rng.integers(-3, 3))
        layer.fill(ellipse(x + 4, hy, 4, 5), c)
        layer.fill(box(x, hy + 4, 9, H - hy), c)
        if rng.random() < arms:
            side = 1 if rng.random() < .5 else -1
            ax = x + 4 + side * 5
            layer.rect(ax, hy - 12, 2, 14, c)
            layer.rect(ax - 1, hy - 14, 3, 3, c)
        x += spacing + int(rng.integers(0, 4))


# ---------------------------------------------------------------- 2  IBIZA (Miss Monique)
def ibiza():
    s = Layer(True)
    sky(s, [(0, '#2a1640'), (70, '#5a2a5c'), (140, '#a4485e'), (190, '#e0804a'), (215, '#f5b04a')])
    # The low sun sitting on the sea, and its glitter on the water.
    s.fill(ellipse(470, 212, 26, 26) & (YS < 214), '#ffe08a')
    s.fill(ellipse(470, 212, 20, 20) & (YS < 214), '#fff4cc')
    sea = YS >= 214
    s.fill(sea, '#3a2450')
    s.fill(sea & (YS >= 232), '#2c1a40')
    for i in range(40):
        yy = 216 + i * 2
        half = 4 + i * 1.3
        m = (YS == yy) & (np.abs(wrapdx(470)) < half) & ((XS // 3 + i) % 4 != 0)
        s.fill(m, '#e0801e' if i < 12 else '#a4485e')
    s.save('ibiza', '0-sky.png')

    # Far: Es Vedra, the rock island off Ibiza, and a second low island.
    f = Layer()
    f.fill(tri(150, 140, 46, 214) & (YS < 214) & (np.abs(wrapdx(150)) < 46), '#3a1c40')
    f.fill(ellipse(150, 214, 60, 30) & (YS < 214) & (YS > 196), '#3a1c40')
    f.fill(ellipse(300, 214, 70, 12) & (YS < 214), '#401f44')
    f.save('ibiza', '1-far.png')

    # Mid: the white town on the hill (Dalt Vila), cubes catching the sunset.
    m = Layer()
    hill = ridge(222, [(1, 14), (3, 6)], seed=2)
    m.fill(under(hill) & (YS < 300), '#4a2848')
    rng = np.random.default_rng(5)
    for i in range(46):
        x = int(rng.integers(0, W))
        top = int(hill[x % W]) - int(rng.integers(8, 26))
        w = int(rng.integers(10, 20))
        m.rect(x, top, w, 300 - top, '#a07a8c')
        m.rect(x + w - 3, top, 3, 300 - top, '#7a5670')
        for wy in range(top + 4, top + 20, 7):
            m.rect(x + 3, wy, 2, 3, '#5a3a58')
    m.outline()
    m.save('ibiza', '2-mid.png')

    # Near: palm trees and the crowd with hands up at Miss Monique's set.
    n = Layer()
    for x, h in ((40, 120), (250, 140), (420, 110), (590, 132)):
        palm(n, x, GROUND + 10, h)
        palm(n, x + 30, GROUND + 10, h - 30)
    crowd(n, 236, ['#1a0c20', '#22102a'], seed=4, arms=0.45)
    n.outline()
    n.save('ibiza', '3-near.png')


# ---------------------------------------------------------------- 3  MELLOW (Marshmello)
def mellow():
    s = Layer(True)
    sky(s, [(0, '#2e2a52'), (90, '#5a5a8c'), (180, '#9a96b6'), (240, '#cfd8ec')])
    stars(s, 70, 110, seed=3)
    s.fill(ellipse(120, 60, 18, 18), '#fdfefd')
    s.fill(ellipse(126, 56, 18, 18), '#2e2a52')  # a crescent moon
    s.save('mellow', '0-sky.png')

    # Far: rolling hills of giant marshmallows (soft white with lilac shadow).
    f = Layer()
    for i, x in enumerate(range(0, W, 80)):
        cy = 200 + (i % 3) * 8
        f.fill(ellipse(x + 40, cy, 46, 40) & (YS < cy + 10), '#bdb6d0')
        f.fill(ellipse(x + 34, cy - 6, 36, 30) & (YS < cy + 10), '#d8d4e8')
    f.fill(YS >= 210, '#bdb6d0')
    f.save('mellow', '1-far.png')

    # Mid: marshmallows stuck on long wooden sticks, toasted brown on one side.
    m = Layer()
    for i, x in enumerate(range(30, W, 106)):
        top = 120 + (i * 37) % 40
        m.rect(x, top, 3, GROUND - top, '#7a4a24')
        m.rect(x, top, 1, GROUND - top, '#a8723a')
        m.fill(box(x - 9, top - 22, 21, 24), '#ece8f4')
        m.fill(box(x - 9, top - 22, 21, 4), '#fdfefd')
        m.fill(box(x + 6, top - 18, 6, 20), '#c08a5a')
        m.fill(box(x - 9, top - 2, 21, 2), '#9a96b6')
    m.fill(YS >= 236, '#9a96b6')
    m.fill(under(ridge(236, [(2, 5), (5, 2)], 1)) & (YS < 244), '#bdb6d0')
    m.outline()
    m.save('mellow', '2-mid.png')

    # Near: campfires with logs and a ring of stones.
    n = Layer()
    for x in (90, 330, 540):
        b = GROUND - 2
        n.rect(x - 14, b - 4, 28, 4, '#4e2a16')
        n.rect(x - 10, b - 8, 20, 4, '#7a4a24')
        n.fill(tri(x, b - 34, 10, b - 6), '#e0801e')
        n.fill(tri(x - 1, b - 26, 6, b - 6), '#f5b04a')
        n.fill(tri(x, b - 18, 3, b - 6), '#ffe08a')
        for k in range(-3, 4):
            n.fill(ellipse(x + k * 7, b + 2, 4, 3), '#5e5763')
    n.outline()
    n.save('mellow', '3-near.png')


# ---------------------------------------------------------------- 4  SAN FRANDISCO (Dom Dolla)
def sanfrandisco():
    s = Layer(True)
    sky(s, [(0, '#1e1640'), (80, '#46306a'), (150, '#a4485e'), (205, '#e0804a'), (230, '#f0a360')])
    s.fill(YS >= 226, '#2c2448')  # the bay
    for y in range(230, 264, 5):
        s.fill((YS == y) & ((XS // 7 + y) % 3 == 0), '#46306a')
    s.save('sanfrandisco', '0-sky.png')

    # Far: the Golden Gate Bridge across the bay, in its orange-red.
    f = Layer()
    red, dark = '#8f2a2a', '#5e1c22'
    f.fill(under(ridge(222, [(1, 10), (4, 3)], 4)) & (YS < 228), '#3a2448')  # Marin hills
    for tx in (180, 420):
        f.rect(tx, 110, 6, 118, red)
        f.rect(tx + 14, 110, 6, 118, red)
        for y in (110, 140, 175):
            f.rect(tx, y, 20, 4, dark)
    deck = 196
    f.rect(0, deck, W, 4, red)
    # Main cables hanging between the towers.
    for x in range(W):
        for t0, t1 in ((183, 423), (423, 183 + W)):
            span = (t1 - t0)
            u = ((x - t0) % W) / span
            if 0 <= u <= 1 and ((x - t0) % W) <= span:
                y = int(112 + (deck - 120) * (1 - (2 * u - 1) ** 2) * 0.95)
                f.px(x, y, red)
                if x % 6 == 0:
                    for yy in range(y, deck):
                        f.px(x, yy, dark)
    f.save('sanfrandisco', '1-far.png')

    # Mid: the Painted Ladies, a row of Victorian houses in pastel colours, up a hill.
    m = Layer()
    hill = ridge(250, [(1, 20)], 0)
    m.fill(under(hill), '#2a3a2c')
    colors = [('#6a5aa0', '#4a3a78'), ('#3a7a8a', '#2a5a6a'), ('#c07a6a', '#8f5a50'), ('#c8b06a', '#8f7a48'), ('#6a8a5a', '#4a6a40')]
    for i, x in enumerate(range(0, W, 40)):
        base = int(hill[(x + 20) % W])
        top = base - 66
        main, shade = colors[i % len(colors)]
        m.rect(x + 2, top, 36, base - top, main)
        m.rect(x + 30, top, 8, base - top, shade)
        m.fill(tri(x + 20, top - 18, 20, top) & (YS < top), shade)
        m.rect(x + 8, top + 10, 8, 14, '#f5b04a')  # bay window
        m.rect(x + 20, top + 10, 8, 14, '#2a1e40')
        m.rect(x + 8, top + 34, 8, 12, '#2a1e40')
        m.rect(x + 22, top + 40, 8, base - top - 40, '#1e1430')  # door
        m.rect(x + 2, top - 1, 36, 2, '#e8e0d0')
    m.outline()
    m.save('sanfrandisco', '2-mid.png')

    # Near: Hyde Street's cable-car rails and a cable car, with a disco ball hanging in the sky.
    n = Layer()
    n.rect(0, GROUND - 4, W, 4, '#3a3040')
    n.rect(0, GROUND - 2, W, 1, '#8e8790')
    cx, by = 300, GROUND - 6
    n.rect(cx, by - 40, 70, 34, '#8f2a2a')
    n.rect(cx, by - 46, 70, 6, '#c8b06a')
    n.rect(cx - 4, by - 48, 78, 3, '#5e1c22')
    for k in range(5):
        n.rect(cx + 5 + k * 13, by - 36, 9, 12, '#f5c35c')
    n.rect(cx, by - 20, 70, 3, '#c8b06a')
    n.rect(cx + 8, by - 6, 10, 6, '#221533')
    n.rect(cx + 52, by - 6, 10, 6, '#221533')
    n.rect(cx + 34, by - 70, 2, 22, '#30233f')  # the grip pole up to the cable
    # Disco ball on a wire.
    dx = 120
    n.rect(dx, 0, 1, 60, '#6f6379')
    ball = ellipse(dx, 72, 13, 13)
    n.fill(ball, '#827788')
    n.fill(ball & (((XS // 4) + (YS // 4)) % 2 == 0), '#c3afac')
    n.fill(ellipse(dx - 4, 67, 4, 4), '#fdfefd')
    n.outline()
    n.save('sanfrandisco', '3-near.png')


# ---------------------------------------------------------------- 5  BAKERY (Steve Aoki)
def bakery():
    s = Layer(True)
    sky(s, [(0, '#1e1a2c'), (120, '#302a40'), (260, '#3e3448')])
    # Factory hall: tall windows with the night outside, steel roof trusses.
    for x in range(20, W, 120):
        s.rect(x, 40, 60, 120, '#2a3a5a')
        s.rect(x, 40, 60, 3, '#54455c')
        for k in range(1, 3):
            s.rect(x + k * 20, 40, 2, 120, '#54455c')
        s.rect(x, 100, 60, 2, '#54455c')
        s.fill(box(x + 4, 46, 12, 50) & ((XS + YS) % 9 == 0), '#688ab0')
    for x in range(0, W, 40):
        s.rect(x, 0, 3, 30, '#452c3b')
    s.rect(0, 28, W, 4, '#452c3b')
    s.save('bakery', '0-sky.png')

    # Far: racks of finished cakes on trolleys.
    f = Layer()
    rng = np.random.default_rng(7)
    for x in range(10, W, 90):
        f.rect(x, 130, 3, 110, '#6f6379')
        f.rect(x + 60, 130, 3, 110, '#6f6379')
        for y in range(140, 236, 24):
            f.rect(x, y, 63, 2, '#827788')
            for k in range(3):
                cx = x + 6 + k * 19
                c = ['#f18492', '#fae8bf', '#c08a5a'][int(rng.integers(0, 3))]
                f.rect(cx, y - 10, 14, 10, c)
                f.rect(cx, y - 11, 14, 2, '#fdfefd')
    f.save('bakery', '1-far.png')

    # Mid: conveyor belts carrying cakes, with robot arms over them.
    m = Layer()
    belt_y = 214
    m.rect(0, belt_y, W, 8, '#30233f')
    m.fill((YS >= belt_y) & (YS < belt_y + 2) & ((XS // 6) % 2 == 0), '#6f6379')
    for x in range(10, W, 32):
        m.fill(ellipse(x + 5, belt_y + 12, 4, 4), '#54455c')
    for x in range(0, W, 64):
        m.rect(x + 20, belt_y + 8, 4, 40, '#452c3b')
    for x in range(30, W, 75):
        m.rect(x, belt_y - 12, 20, 12, '#db6684')
        m.rect(x, belt_y - 14, 20, 3, '#fdfefd')
        m.rect(x + 9, belt_y - 18, 2, 4, '#f5c35c')
    for x in (100, 420):
        m.rect(x, 60, 12, 20, '#e0931a')     # base on the ceiling rail
        m.rect(x + 4, 80, 5, 50, '#c3afac')    # upper arm
        m.rect(x + 4, 128, 40, 5, '#c3afac')   # forearm
        m.fill(ellipse(x + 6, 130, 6, 6), '#e0931a')
        m.rect(x + 42, 130, 3, 40, '#a396a6')
        m.rect(x + 36, 168, 14, 4, '#6f6379')  # gripper
        m.rect(x + 36, 172, 2, 6, '#6f6379')
        m.rect(x + 48, 172, 2, 6, '#6f6379')
    m.outline()
    m.save('bakery', '2-mid.png')

    # Near: flour sacks and stacked trays.
    n = Layer()
    for x in (60, 300, 500):
        n.fill(ellipse(x, GROUND - 10, 14, 16), '#cfcdcd')
        n.fill(ellipse(x + 3, GROUND - 6, 10, 10), '#a396a6')
        n.rect(x - 6, GROUND - 26, 12, 3, '#827788')
    for x in (180, 420):
        for k in range(4):
            n.rect(x, GROUND - 8 - k * 8, 40, 5, '#827788')
            n.rect(x, GROUND - 8 - k * 8, 40, 1, '#c3afac')
    n.outline()
    n.save('bakery', '3-near.png')


# ---------------------------------------------------------------- 6  VAIL (John Summit)
def vail():
    s = Layer(True)
    sky(s, [(0, '#2e3a6a'), (60, '#6a5a8c'), (130, '#c08a6a'), (180, '#f0a360'), (215, '#fddd91')])
    s.save('vail', '0-sky.png')

    # Far: layered ridgelines fading into the golden sky.
    f = Layer()
    for k, (base, col, snow) in enumerate(((170, '#8f6a80', '#c8a8b0'), (196, '#5e4a6a', '#a090a8'))):
        h = ridge(base, [(2, 26 - k * 6), (5, 9), (11, 3)], seed=k + 3)
        f.fill(under(h), col)
        f.fill(under(h) & (YS < h[None, :] + 6 + (XS % 5 == 0)), snow)
    f.save('vail', '1-far.png')

    # Mid: the ski run, pines, and the gondola line with its cabins.
    m = Layer()
    slope = ridge(222, [(1, 18), (3, 6)], seed=8)
    m.fill(under(slope), '#cfd8ec')
    m.fill(under(slope + 16), '#9a96b6')
    rng = np.random.default_rng(9)
    for i in range(34):
        x = int(rng.integers(0, W))
        b = int(slope[x % W]) + int(rng.integers(4, 30))
        h = int(rng.integers(20, 40))
        m.fill(tri(x, b - h, h // 3, b), '#1f3a32')
        m.fill(tri(x - 1, b - h, h // 5, b - h // 3), '#2c5a44')
        m.rect(x - 1, b, 3, 4, '#2a140e')
    # The gondola cable sagging between two pylons, with cabins.
    for x in range(W):
        y = int(70 + 18 * math.sin(math.pi * (x % 320) / 320))
        m.px(x, y, '#30233f')
    for px_ in (0, 320):
        m.rect(px_ - 2, 66, 5, 170, '#30233f')
        m.rect(px_ - 8, 66, 17, 3, '#30233f')
    for cxx in (90, 240, 430, 560):
        y = int(70 + 18 * math.sin(math.pi * (cxx % 320) / 320))
        m.rect(cxx, y, 1, 12, '#30233f')
        m.rect(cxx - 9, y + 12, 19, 16, '#8f2a2a')
        m.rect(cxx - 7, y + 15, 15, 6, '#cfd8ec')
    m.outline()
    m.save('vail', '2-mid.png')

    # Near: big snowy pines and a skier silhouette.
    n = Layer()
    for x, h in ((40, 90), (210, 70), (470, 100), (600, 76)):
        b = GROUND + 4
        for k in range(3):
            n.fill(tri(x, b - h + k * h // 4, h // 4 + k * 4, b - h // 4 + k * h // 6), '#14302a')
            n.fill(tri(x - 2, b - h + k * h // 4, h // 7 + k * 2, b - h // 2 + k * h // 6), '#cfd8ec')
        n.rect(x - 2, b - 10, 5, 10, '#2a140e')
    sx, sy = 330, 200
    n.fill(ellipse(sx, sy, 3, 3), '#221533')
    n.rect(sx - 2, sy + 2, 5, 9, '#221533')
    n.rect(sx - 8, sy + 11, 18, 2, '#221533')
    n.outline()
    n.save('vail', '3-near.png')


# ---------------------------------------------------------------- 7  GHENT (Charlotte de Witte)
def ghent():
    s = Layer(True)
    sky(s, [(0, '#0a0c22'), (100, '#141a3e'), (200, '#1e2a5a'), (240, '#2a3a6a')])
    stars(s, 50, 120, seed=7)
    s.fill(YS >= 236, '#0e1430')  # the canal, ink blue
    for y in range(238, 300, 3):
        s.fill((YS == y) & ((XS // 5 + y // 3) % 4 == 0), '#1e2a5a')
    s.save('ghent', '0-sky.png')

    # Far: Gravensteen castle towers lit from below.
    f = Layer()
    stone, lit = '#2a2a44', '#5a4a52'
    f.rect(0, 170, W, 70, '#1c1c34')
    for x in (100, 400):
        f.rect(x, 110, 70, 130, stone)
        f.rect(x + 10, 80, 22, 160, stone)
        f.rect(x + 46, 90, 18, 150, stone)
        for tx, ty, tw in ((x + 10, 80, 22), (x + 46, 90, 18), (x, 110, 70)):
            for k in range(0, tw, 6):
                f.rect(tx + k, ty - 5, 4, 5, stone)
        f.fill(box(x, 200, 70, 40) & (BAYER > 0.4), lit)
        f.rect(x + 28, 150, 6, 10, '#f5b04a')
    f.save('ghent', '1-far.png')

    # Mid: the Graslei's stepped gables with amber windows, reflected in the canal.
    m = Layer()
    colors = ['#3a2a40', '#2e2a48', '#40303a', '#34283e']
    x = 0
    i = 0
    rng = np.random.default_rng(11)
    while x < W:
        w = int(rng.integers(30, 46))
        top = 150 + int(rng.integers(-16, 12))
        col = colors[i % len(colors)]
        m.rect(x, top, w, 236 - top, col)
        # Stepped gable: shrinking steps up to a point.
        steps = 4
        for k in range(steps):
            inset = (k + 1) * w // (2 * steps + 2)
            m.rect(x + inset, top - (k + 1) * 7, w - 2 * inset, 7, col)
        windows(m, x + 2, top + 6, w - 4, 236 - top - 10, 3, 4, '#e0931a', '#1a1630', seed=i)
        # Reflection in the water: dim amber streaks.
        for yy in range(240, 290, 4):
            m.fill(box(x + 4, yy, w - 8, 1) & ((XS // 3 + yy) % 3 == 0), '#7a4a24')
        x += w + 1
        i += 1
    m.outline()
    m.save('ghent', '2-mid.png')

    # Near: the canal wall, mooring posts and a street lamp.
    n = Layer()
    n.rect(0, GROUND - 14, W, 14, '#2a2a3a')
    n.fill(box(0, GROUND - 14, W, 14) & (((XS // 10) + (YS // 5)) % 2 == 0), '#34344a')
    for x in range(40, W, 160):
        n.rect(x, GROUND - 74, 3, 60, '#221533')
        n.fill(ellipse(x + 1, GROUND - 78, 5, 6), '#f5b04a')
        n.rect(x + 80, GROUND - 22, 6, 8, '#221533')
    n.outline()
    n.save('ghent', '3-near.png')


# ---------------------------------------------------------------- 8  SNAPPER (Fisher)
def snapper():
    s = Layer(True)
    sky(s, [(0, '#1e4a80'), (90, '#4a6a98'), (170, '#8aa0b8'), (200, '#d8a860')])
    for cx, cy in ((80, 60), (330, 40), (520, 80)):
        s.fill(ellipse(cx, cy, 30, 8), '#9aaac4')
        s.fill(ellipse(cx + 12, cy - 5, 16, 8), '#c4cede')
    s.fill(YS >= 196, '#1a6a78')  # the sea
    s.fill(YS >= 214, '#145060')
    s.save('snapper', '0-sky.png')

    # Far: the Gold Coast skyline across the bay.
    f = Layer()
    rng = np.random.default_rng(13)
    for x in range(0, W, 9):
        if (x // 9) % 7 in (0, 1, 2, 3):
            h = int(rng.integers(14, 60))
            f.rect(x, 196 - h, 8, h, '#6f8aa8')
            f.rect(x + 6, 196 - h, 2, h, '#5a7090')
    f.save('snapper', '1-far.png')

    # Mid: the breaking wave with surfers' foam, dolphins and the patrol tower on the sand.
    m = Layer()
    wave = ridge(218, [(3, 6), (7, 2)], seed=1)
    m.fill(under(wave) & (YS < 236), '#2896a8')
    m.fill(under(wave) & (YS < wave[None, :] + 3), '#fdfefd')
    m.fill(YS >= 236, '#b8a070')  # the beach
    m.fill((YS >= 236) & (YS < 240), '#d8c090')
    for dx in (160, 460):
        m.fill(ellipse(dx, 214, 12, 4) & (YS < 216), '#5e6a80')
        m.fill(tri(dx + 2, 204, 3, 212), '#5e6a80')
    tx = 300
    for k in (0, 26):
        m.rect(tx + k, 196, 3, 44, '#c3afac')
    m.rect(tx - 4, 180, 36, 18, '#e8e0d0')
    m.rect(tx - 6, 176, 40, 5, '#db3a3a')
    m.rect(tx + 4, 184, 10, 8, '#2e67a9')
    m.rect(tx + 18, 184, 10, 8, '#2e67a9')
    m.outline()
    m.save('snapper', '2-mid.png')

    # Near: the rock shelf of Snapper Rocks, wet and dark.
    n = Layer()
    rocks = ridge(GROUND - 4, [(5, 6), (13, 3)], seed=5)
    n.fill(under(rocks), '#3e3438')
    n.fill(under(rocks) & (YS < rocks[None, :] + 3), '#6a5a5a')
    for x in range(0, W, 23):
        n.fill(ellipse(x, int(rocks[x]) + 8, 6, 3), '#2a2228')
    n.outline()
    n.save('snapper', '3-near.png')


# ---------------------------------------------------------------- 9  LIVERPOOL (James Hype)
def liverpool():
    s = Layer(True)
    sky(s, [(0, '#1e1a40'), (90, '#3a3060'), (170, '#8f5a70'), (220, '#e0905a')])
    s.save('liverpool', '0-sky.png')

    # Far: the Royal Liver Building, its two clock towers and the Liver Birds on top.
    f = Layer()
    col, dim = '#3e3450', '#2e2840'
    f.rect(0, 200, W, 40, dim)
    for x in (120, 440):
        f.rect(x, 120, 120, 120, col)
        windows(f, x + 4, 124, 112, 70, 10, 6, '#c08a5a', '#2a2238', seed=x)
        for tx in (x + 4, x + 86):
            f.rect(tx, 70, 30, 52, col)
            f.fill(ellipse(tx + 15, 92, 9, 9), '#e0d8b0')  # the clock face
            f.px(tx + 15, 88, OUTLINE)
            f.px(tx + 15, 89, OUTLINE)
            f.px(tx + 16, 92, OUTLINE)
            f.fill(ellipse(tx + 15, 66, 10, 10) & (YS < 68), col)  # the dome
            f.rect(tx + 14, 50, 3, 8, col)
            f.fill(ellipse(tx + 15, 48, 4, 3), '#4a5a4a')  # a Liver Bird
    f.save('liverpool', '1-far.png')

    # Mid: Bold Street shopfronts, brick, with Probe Records' blue door under a brick arch.
    m = Layer()
    x = 0
    i = 0
    bricks = ['#5a2e2a', '#6a3a2e', '#4e2a2e']
    while x < W:
        w = 64
        top = 140 + (i % 3) * 8
        m.rect(x, top, w, 240 - top, bricks[i % 3])
        m.fill(box(x, top, w, 240 - top) & ((YS % 6 == 0) | (((XS + (YS // 6) * 4) % 12) == 0)), '#3e2024')
        windows(m, x + 6, top + 6, w - 12, 44, 3, 2, '#e0b45c', '#2a2238', seed=i + 20)
        m.rect(x + 4, 214, w - 8, 3, '#30233f')  # shop sign board
        if i % 5 == 2:
            m.fill(ellipse(x + 32, 216, 14, 14) & (YS < 216), '#6a3a2e')
            m.rect(x + 20, 216, 24, 24, '#2e67a9')  # the blue door
            m.rect(x + 22, 218, 20, 3, '#688ab0')
        else:
            m.rect(x + 8, 220, w - 16, 20, '#e0b45c')
            m.rect(x + 8, 220, w - 16, 2, '#f5c35c')
        x += w + 2
        i += 1
    m.outline()
    m.save('liverpool', '2-mid.png')

    # Near: Concert Square paving and street lamps with bunting.
    n = Layer()
    for x in range(30, W, 128):
        n.rect(x, GROUND - 80, 3, 80, '#221533')
        n.rect(x - 4, GROUND - 84, 11, 5, '#221533')
        n.fill(ellipse(x + 1, GROUND - 76, 4, 3), '#f5c35c')
    for x in range(W):
        y = int(GROUND - 92 + 8 * math.sin(math.pi * (x % 128) / 128))
        n.px(x, y, '#30233f')
        if x % 8 < 4 and x % 16 < 8:
            for k in range(1, 4 - abs(x % 8 - 2)):
                n.px(x, y + k, ['#db3a3a', '#f5c35c', '#2e67a9'][(x // 16) % 3])
    n.outline()
    n.save('liverpool', '3-near.png')


# ---------------------------------------------------------------- 10  THE BEND (Carl Cox)
def thebend():
    s = Layer(True)
    sky(s, [(0, '#24163a'), (70, '#5a2a5c'), (140, '#b8501a'), (190, '#e0801e'), (220, '#f5b04a')])
    s.fill(YS >= 214, '#8f3a22')  # red outback dirt
    s.fill((YS >= 214) & (YS < 218), '#b8501a')
    s.save('thebend', '0-sky.png')

    # Far: low outback hills and the grandstand with its roof.
    f = Layer()
    f.fill(under(ridge(208, [(1, 6), (4, 3)], seed=2)) & (YS < 216), '#5a2a3a')
    for x in (60, 380):
        f.rect(x, 170, 180, 44, '#3e3448')
        for k in range(6):
            f.rect(x + 4, 176 + k * 6, 172, 2, '#54455c')
        f.rect(x - 6, 160, 192, 8, '#6f6379')
        for k in range(0, 180, 30):
            f.rect(x + k, 166, 3, 6, '#30233f')
    f.save('thebend', '1-far.png')

    # Mid: the open pit garages, the starting-light tower and the drag strip's barrier.
    m = Layer()
    for x in range(0, W, 80):
        m.rect(x, 170, 76, 66, '#4a4458')
        m.rect(x, 166, 76, 5, '#6f6379')
        m.rect(x + 6, 182, 64, 54, '#1e1430')
        m.rect(x + 6, 182, 64, 4, '#827788')  # roller door rolled up
        m.rect(x + 14, 220, 20, 6, '#8f2a2a')  # a car's nose inside
        m.rect(x + 46, 212, 14, 24, '#3e3448')
    tx = 520
    m.rect(tx, 120, 6, 116, '#30233f')
    m.rect(tx - 8, 120, 22, 60, '#221533')
    for k, c in enumerate(('#db3a3a', '#f5b04a', '#f5b04a', '#3cae4a')):
        m.fill(ellipse(tx + 3, 128 + k * 13, 4, 4), c)
    m.rect(0, 236, W, 6, '#cfcdcd')
    m.fill(box(0, 236, W, 6) & ((XS // 12) % 2 == 0), '#db3a3a')
    m.outline()
    m.save('thebend', '2-mid.png')

    # Near: stacks of black tyres along the strip.
    n = Layer()
    for x in range(20, W, 110):
        for k in range(4):
            y = GROUND - 8 - k * 9
            n.fill(ellipse(x, y, 13, 5), '#221533')
            n.fill(ellipse(x, y, 6, 2), '#0e0413')
            n.fill(ellipse(x - 4, y - 2, 4, 1), '#54455c')
    n.outline()
    n.save('thebend', '3-near.png')


WORLDS = {
    'ibiza': ibiza, 'mellow': mellow, 'sanfrandisco': sanfrandisco, 'bakery': bakery, 'vail': vail,
    'ghent': ghent, 'snapper': snapper, 'liverpool': liverpool, 'thebend': thebend,
}

if __name__ == '__main__':
    for name in sys.argv[1:] or WORLDS:
        WORLDS[name]()
        print('drew', name)
