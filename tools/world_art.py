"""Draws the world art (tiles, blocks, items, ride duck, background) at the hero's pixel size.

Everything here uses the project style guide: 1-pixel #150b22 outline, 3-step color ramps lit from
the top left, warm shadows. Pictures are drawn at twice the world resolution and shown at half
size in the game, exactly like the hero, so one picture pixel is one screen pixel everywhere.

Run from the repo root:  python3 tools/world_art.py   (needs Pillow and numpy)
"""
import os
import random
import numpy as np
from pixelkit import Canvas, OUTLINE

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'src', 'art', 'world')
T = 32  # one 16 px world tile, drawn at the hero's pixel size

STONE = ['#3a261c', '#5e4434', '#8a6a50', '#b08a64', '#d0aa7c']   # mortar .. highlight
GOLD = ['#9a5a10', '#e0931a', '#f5c35c', '#f7ce12', '#fae8bf']
BRICK = ['#5a2a10', '#8a3e1a', '#b8642a', '#e08a50', '#f2b07a']
USED = ['#2e2228', '#4a3a3a', '#6a5048', '#8a6e62']
WHITE = ['#9a96a6', '#cfcdcd', '#fdfefd']
BLUE = ['#354169', '#2e67a9', '#688ab0']
DUCK = ['#e0931a', '#f5c35c', '#f7ce12', '#fae8bf']
BEAK = ['#9a3a10', '#e45c10', '#f08a40']
MANGO = ['#9a2a1a', '#d04a20', '#f2852a', '#f7ce12']
LEAF = ['#123a20', '#1e5a2e', '#3cae4a', '#8ad860']
HEART = ['#6a0a20', '#c0203a', '#f04a5a', '#ffb0b8']


# ---------- tiles ----------

def bricks(c, ox, y0, ramp, bw=16, bh=8, seed=1, speckle=True):
    """Staggered bricks from row y0 to the bottom of a tile. ramp: mortar, shadow, base, light, shine."""
    rnd = random.Random(seed)
    mortar, dark, base, light, shine = ramp
    c.rect(ox, y0, T, T - y0, mortar)
    for row, y in enumerate(range(y0, T, bh)):
        shift = (bw // 2) if row % 2 else 0
        for x in range(-shift, T, bw):
            x0, x1 = max(0, x), min(T, x + bw - 1)    # 1 px mortar on the right
            y1 = min(T, y + bh - 1)                    # 1 px mortar below
            if x1 <= x0:
                continue
            c.rect(ox + x0, y, x1 - x0, y1 - y, base)
            c.rect(ox + x0, y, x1 - x0, 1, light)            # top light
            if x == x0:
                c.rect(ox + x0, y, 1, y1 - y, light)         # left light
            c.rect(ox + x0, y1 - 1, x1 - x0, 1, dark)        # bottom shadow
            if x + bw - 1 <= T:
                c.rect(ox + x1 - 1, y, 1, y1 - y, dark)      # right shadow
            c.px(ox + x0 + 1, y + 1, shine)
            if speckle:
                for _ in range(2):
                    sx, sy = rnd.randint(x0 + 2, max(x0 + 2, x1 - 3)), rnd.randint(y + 2, max(y + 2, y1 - 3))
                    c.px(ox + sx, sy, dark)


def gold_rim(c, ox, h=8):
    dark2, dark, mid, base, light = GOLD
    c.rect(ox, 0, T, 1, OUTLINE)
    c.rect(ox, 1, T, h - 2, base)
    c.rect(ox, 1, T, 1, light)
    c.rect(ox, h - 3, T, 1, mid)
    c.rect(ox, h - 2, T, 1, dark)
    c.rect(ox, h - 1, T, 1, OUTLINE)
    for x in range(3, T, 8):                     # studs
        c.rect(ox + x, 3, 2, 2, light)
        c.px(ox + x + 1, 4, mid)


def bevel_block(c, ox, ramp, border=OUTLINE):
    dark, base, light = ramp[1], ramp[2], ramp[3]
    c.rect(ox, 0, T, T, border)
    c.rect(ox + 1, 1, T - 2, T - 2, base)
    c.rect(ox + 1, 1, T - 2, 2, light)
    c.rect(ox + 1, 1, 2, T - 2, light)
    c.rect(ox + 1, T - 3, T - 2, 2, dark)
    c.rect(ox + T - 3, 1, 2, T - 2, dark)
    c.px(ox + 1, T - 3, base); c.px(ox + 2, T - 2, base)
    c.px(ox + T - 3, 1, base); c.px(ox + T - 2, 2, base)


def rivets(c, ox, light, dark):
    for x, y in [(5, 5), (T - 7, 5), (5, T - 7), (T - 7, T - 7)]:
        c.rect(ox + x, y, 2, 2, dark)
        c.px(ox + x, y, light)


def music_note(c, ox, color=OUTLINE, shadow=None):
    def draw(dx, dy, col):
        c.rect(ox + 18 + dx, 7 + dy, 2, 15, col)          # stem
        for i in range(5):                                  # flag
            c.rect(ox + 20 + dx, 8 + i + dy, 3 - (i // 2), 1, col)
        c.rect(ox + 23 + dx, 11 + dy, 1, 4, col)
        m = c.ellipse_mask(ox + 15.5 + dx, 22 + dy, 4.5, 3.2)
        c.fill(m, col)
    if shadow:
        draw(1, 1, shadow)
    draw(0, 0, color)
    c.px(ox + 13, 21, GOLD[4])                              # shine on the note head


def tiles():
    c = Canvas(T * 7, T)
    # 0 ground top: gold rim over stone
    bricks(c, 0, 8, STONE, bh=12, seed=1)
    gold_rim(c, 0)
    # 1 solid block: bevelled stone with an inset
    bevel_block(c, T, STONE)
    c.rect(T + 11, 11, 10, 10, STONE[1])
    c.rect(T + 12, 12, 8, 8, STONE[2])
    c.rect(T + 12, 12, 8, 1, STONE[3]); c.rect(T + 12, 12, 1, 8, STONE[3])
    # 2 thin platform: gold rim on a short stone lip
    gold_rim(c, 2 * T)
    c.rect(2 * T, 8, T, 6, STONE[2])
    c.rect(2 * T, 8, T, 1, STONE[3])
    c.rect(2 * T, 12, T, 1, STONE[1])
    for x in range(0, T, 8):
        c.rect(2 * T + x + 7, 8, 1, 5, STONE[0])
    c.rect(2 * T, 13, T, 1, OUTLINE)
    # 3 ground fill: stone wall
    bricks(c, 3 * T, 0, STONE, bh=16, seed=3)
    # 4 music-note block
    bevel_block(c, 4 * T, GOLD[:1] + GOLD[1:])
    rivets(c, 4 * T, GOLD[4], GOLD[1])
    music_note(c, 4 * T, OUTLINE, GOLD[1])
    # 5 used block
    bevel_block(c, 5 * T, USED)
    rivets(c, 5 * T, USED[3], USED[0])
    # 6 breakable brick
    bricks(c, 6 * T, 0, BRICK, bh=16, seed=6, speckle=False)
    c.rect(6 * T, 0, T, 1, BRICK[4])
    c.save(os.path.join(OUT, 'tiles.png'))

    # Brick piece for the break animation.
    p = Canvas(10, 10)
    p.rect(1, 1, 8, 8, BRICK[2]); p.rect(1, 1, 8, 2, BRICK[3]); p.rect(1, 1, 2, 8, BRICK[3])
    p.rect(1, 7, 8, 2, BRICK[1]); p.rect(7, 1, 2, 8, BRICK[1])
    p.outline(inside=True)
    p.save(os.path.join(OUT, 'brick-piece.png'))


# ---------- items ----------

def mango():
    c = Canvas(22, 20)
    m = c.ellipse_mask(11, 12.5, 9.5, 6.5)
    c.shade(m, 11, 12.5, 9.5, 6.5, MANGO, cuts=(-0.35, 0.15, 0.7))
    c.fill(c.ellipse_mask(6.5, 10, 2.2, 1.4) & m, '#ffe68a')      # shine
    lm = c.ellipse_mask(14, 4.5, 4.5, 2)                           # leaf
    c.shade(lm, 14, 4.5, 4.5, 2, LEAF[1:], cuts=(0.0, 0.6))
    c.rect(10, 4, 2, 3, '#5a3a1a')                                 # stem
    c.outline()
    c.save(os.path.join(OUT, 'mango.png'))


def egg():
    c = Canvas(26, 30)
    m = c.ellipse_mask(13, 16, 11, 13.5)
    c.shade(m, 13, 16, 11, 13.5, WHITE, cuts=(-0.35, 0.45))
    for x, y, r in [(9, 10, 2.6), (17, 17, 3), (8, 22, 2.4), (18, 7, 1.8), (14, 25, 1.8)]:
        sm = c.ellipse_mask(x, y, r, r * 0.85) & m
        c.shade(sm, x, y, r, r, GOLD[1:4], cuts=(-0.2, 0.5))
    c.fill(c.ellipse_mask(8, 7, 2, 2.6) & m, '#ffffff')
    c.outline()
    c.save(os.path.join(OUT, 'egg.png'))
    # Half shell: the left half of the egg with a zigzag crack (the game mirrors it for the right).
    half = Canvas(14, 30)
    ys, xs = np.mgrid[0:30, 0:14]
    zig = 11 + np.abs((ys % 6) - 3) - 1
    hm = half.ellipse_mask(13, 16, 11, 13.5) & (xs < zig)
    half.shade(hm, 13, 16, 11, 13.5, WHITE, cuts=(-0.35, 0.45))
    sm = half.ellipse_mask(9, 10, 2.6, 2.2) & hm
    half.shade(sm, 9, 10, 2.6, 2.6, GOLD[1:4], cuts=(-0.2, 0.5))
    half.outline()
    half.save(os.path.join(OUT, 'egg-half.png'))


def hearts():
    shape = [
        "..xxx...xxx..",
        ".xxxxx.xxxxx.",
        "xxxxxxxxxxxxx",
        "xxxxxxxxxxxxx",
        "xxxxxxxxxxxxx",
        ".xxxxxxxxxxx.",
        "..xxxxxxxxx..",
        "...xxxxxxx...",
        "....xxxxx....",
        ".....xxx.....",
        "......x......",
    ]
    for name, ramp in [('heart', HEART), ('heart-empty', ['#1e1430', '#2e2240', '#4a3a5c', '#6a5a7c'])]:
        c = Canvas(15, 13)
        m = np.zeros((13, 15), bool)
        for y, row in enumerate(shape):
            for x, ch in enumerate(row):
                m[y + 1, x + 1] = ch == 'x'
        c.shade(m, 7.5, 5.5, 7, 6, ramp, cuts=(-0.4, 0.2, 0.75))
        c.rect(3, 3, 2, 2, ramp[3])
        c.outline()
        c.save(os.path.join(OUT, f'{name}.png'))


def goal():
    """Goal flag: a pink flag with the gold mask emblem on a pole with a gold ball (pole drawn separately)."""
    c = Canvas(30, 26)
    c.fill(c.ellipse_mask(4, 4, 3.5, 3.5), GOLD[3])
    c.shade(c.ellipse_mask(4, 4, 3.5, 3.5), 4, 4, 3.5, 3.5, GOLD[1:], cuts=(-0.3, 0.3, 0.7))
    flag = np.zeros((26, 30), bool)
    for y in range(9, 24):
        for x in range(6, 29):
            if abs(y - 16) <= 7 - (x - 6) * 7 / 23 + 0.5:
                flag[y, x] = True
    c.shade(flag, 12, 16, 10, 8, ['#a02a6a', '#e04a8a', '#ff7ab0'], cuts=(-0.2, 0.5))
    c.fill(c.ellipse_mask(12, 16, 3, 3), GOLD[3]); c.px(11, 15, GOLD[4]); c.px(12, 17, OUTLINE); c.px(13, 17, OUTLINE)
    c.outline()
    c.save(os.path.join(OUT, 'goal-flag.png'))
    p = Canvas(6, 8)
    p.rect(1, 0, 4, 8, '#cfcdcd'); p.rect(1, 0, 1, 8, '#fdfefd'); p.rect(4, 0, 1, 8, '#9a96a6')
    p.rect(0, 0, 1, 8, OUTLINE); p.rect(5, 0, 1, 8, OUTLINE)
    p.save(os.path.join(OUT, 'goal-pole.png'))


# ---------- ride duck ----------

def duck_big():
    """The ride-on rubber duck, drawn with the same chunky detail as the hero (47x55, like before)."""
    W, H = 47, 55
    c = Canvas(W, H)
    body = c.ellipse_mask(22, 41, 20.5, 12.5)
    tail = c.ellipse_mask(5, 32, 4.5, 6.5)
    neck = c.ellipse_mask(28, 31, 9, 7)
    head = c.ellipse_mask(31, 21, 11, 11)
    c.shade(body | tail, 22, 39, 21, 13, DUCK, cuts=(-0.4, 0.05, 0.62))
    c.shade(neck, 28, 31, 9, 7, DUCK, cuts=(-0.6, -0.1, 0.9))
    c.shade(head, 31, 21, 11, 11, DUCK, cuts=(-0.4, 0.05, 0.6))
    # Wing: a rounded lighter shape with a dark lower edge.
    wing = c.ellipse_mask(19, 40, 10, 6.5)
    c.shade(wing, 19, 39, 10, 6.5, DUCK[1:], cuts=(-0.1, 0.55))
    ys, xs = np.mgrid[0:H, 0:W]
    edge = wing & ~(np.roll(wing, -1, 0) & np.roll(wing, -1, 1)) & ((ys > 40) | (xs > 24))
    c.fill(edge, DUCK[0])
    for x0 in (12, 16, 20):
        c.rect(x0, 41, 3, 1, DUCK[0])
    # Beak.
    beak = c.ellipse_mask(42, 25, 4.8, 3.2)
    c.shade(beak, 42, 25, 4.8, 3.2, BEAK, cuts=(-0.2, 0.5))
    c.rect(38, 25, 8, 1, BEAK[0])
    # Mask: blue cap over the top of the head with gold-tipped spikes.
    cap = head & (ys < 16)
    c.shade(cap, 31, 12, 11, 6, BLUE, cuts=(-0.2, 0.5))
    c.rect(20, 15, 22, 1, GOLD[2])
    for i, x in enumerate((22, 27, 32, 37)):
        top = 2 if i in (1, 2) else 4
        for y in range(top, 12):
            half = (y - top) * 2 // 5
            c.rect(x - half, y, 2 + half * 2, 1, BLUE[1])
            c.px(x - half, y, BLUE[2])
        c.rect(x, top, 2, 2, GOLD[3])
    # White face plate with a gold rim, and the eye.
    plate = c.ellipse_mask(35, 21.5, 5.5, 6)
    c.fill(c.ellipse_mask(35, 21.5, 6.5, 7) & head, GOLD[2])
    c.shade(plate, 35, 21.5, 5.5, 6, WHITE[1:], cuts=(0.0,))
    c.rect(35, 19, 3, 4, OUTLINE)
    c.px(36, 19, '#fdfefd')
    c.rect(33, 18, 2, 1, BLUE[1])
    c.outline()
    c.save(os.path.join(OUT, '..', 'duck', 'big.png'))  # replaces the shrunk duck picture




# ---------- background (Ibiza club at sunset), also at the hero's pixel size ----------

def dither_bands(c, colors, top=0, height=None):
    """Horizontal color bands with a 2-row checker dither between them (no smooth gradients)."""
    height = height or c.h
    n = len(colors)
    band = height / n
    for y in range(height):
        i = min(int(y / band), n - 1)
        frac = y / band - i
        for x in range(c.w):
            col = colors[i]
            if i + 1 < n and frac > 0.75 and (x + y) % 2 == 0:
                col = colors[i + 1]
            c.a[top + y, x] = list(int(col[k:k + 2], 16) for k in (1, 3, 5)) + [255]


def sky():
    c = Canvas(640, 360)
    dither_bands(c, ['#24123e', '#341848', '#4a1e54', '#66245a', '#86305c', '#a83e58', '#cc5450', '#e0704a', '#f08c4a', '#f6a64a'])
    # Retro sun with stripes, low on the horizon.
    sun = c.ellipse_mask(470, 250, 64, 64)
    ys = np.mgrid[0:360, 0:640][0]
    c.shade(sun, 470, 250, 64, 64, ['#f2964a', '#ffb85a', '#ffd27a'], light=(0, -1), cuts=(-0.1, 0.45))
    for i, y in enumerate(range(236, 320, 10)):
        c.a[(ys >= y) & (ys < y + 2 + i // 2) & sun] = [0xe0, 0x70, 0x4a, 255]
    # A few flat pixel clouds.
    for cx, cy, w in [(90, 70, 70), (250, 40, 50), (560, 95, 80), (380, 120, 40)]:
        m = c.ellipse_mask(cx, cy, w / 2, 6) | c.ellipse_mask(cx - w / 6, cy - 5, w / 4, 6)
        c.shade(m, cx, cy, w / 2, 9, ['#6a2a5e', '#a04a6a', '#d87a7a'], light=(0, -1), cuts=(-0.1, 0.5))
    return c


def venue():
    W, H = 960, 360
    c = Canvas(W, H)
    rnd = random.Random(7)
    dark, mid, light = '#1c1028', '#2e1c40', '#4a2e5e'
    # Roof with a truss lattice.
    c.rect(0, 0, W, 44, dark)
    c.rect(0, 44, W, 4, OUTLINE)
    c.rect(0, 52, W, 4, mid)
    c.rect(0, 52, W, 1, light)
    for x in range(0, W, 24):
        for i in range(24):
            c.px(x + i, 44 + i // 3, mid)
            c.px(x + 23 - i, 44 + i // 3, mid)
        c.rect(x, 44, 2, 12, mid)
    for x in range(0, W, 16):
        c.rect(x, 6, 10, 2, mid)
        c.px(x, 6, light)
    # Pillars.
    for x in (40, 880):
        c.rect(x, 56, 28, H - 56, '#24142e')
        c.rect(x, 56, 3, H - 56, '#3a2446')
        c.rect(x + 24, 56, 4, H - 56, '#160c20')
        for y in range(80, H, 40):
            c.rect(x, y, 28, 2, '#160c20')
    # LED screen with a big mask made of LED dots.
    sx, sy, sw, sh = 300, 80, 360, 148
    c.rect(sx - 10, sy - 10, sw + 20, sh + 20, '#0c0614')
    c.rect(sx - 10, sy - 10, sw + 20, 2, '#2a1a3a')
    for y in range(sy, sy + sh, 3):
        t = (y - sy) / sh
        base = ['#5a1a4a', '#4a1650', '#3a1258', '#2e1060'][min(3, int(t * 4))]
        for x in range(sx, sx + sw, 3):
            c.rect(x, y, 2, 2, base)
    mx, my = sx + sw // 2, sy + sh // 2 + 8
    face = c.ellipse_mask(mx, my + 10, 44, 40)
    crown_pts = []
    for i in range(-3, 4):
        crown_pts.append((mx + i * 16, my - 46 - (10 if i % 2 == 0 else 0)))
    for y in range(sy, sy + sh, 3):
        for x in range(sx, sx + sw, 3):
            col = None
            if face[y, x]:
                col = '#e8e0f0'
                if abs(y - (my + 2)) < 8 and 10 < abs(x - mx) < 34:
                    col = '#2e67a9'                                  # eye holes
                elif y < my - 14:
                    col = '#f7ce12'                                  # gold forehead
            else:
                for px_, py_ in crown_pts:
                    if py_ <= y < my - 20 and abs(x - px_) < (y - py_) * 0.45 + 2:
                        col = '#f7ce12' if y < py_ + 10 else '#2e67a9'
            if col:
                c.rect(x, y, 2, 2, col)
    # Speaker stacks with cones.
    for x in (240, 684):
        c.rect(x, 64, 36, 150, '#0e0814')
        c.rect(x, 64, 36, 2, '#2a2236')
        for y in range(74, 204, 26):
            cone = c.ellipse_mask(x + 18, y + 10, 11, 11)
            c.shade(cone, x + 18, y + 10, 11, 11, ['#120a1a', '#2a2236', '#463a56'], cuts=(-0.2, 0.55))
            c.fill(c.ellipse_mask(x + 18, y + 10, 4, 4), '#0a0610')
            c.px(x + 16, y + 8, '#5a4a6a')
    # Stage lights on the roof.
    for x in range(12, W, 48):
        col = '#7ad0ff' if rnd.random() > 0.5 else '#ff5a8a'
        c.rect(x, 56, 6, 6, OUTLINE)
        c.rect(x + 1, 57, 4, 4, col)
        c.px(x + 1, 57, '#ffffff')
    # Terrace railings with tiny lamps either side.
    for x0, x1 in ((80, 240), (720, 880)):
        for y in (150, 210):
            c.rect(x0, y, x1 - x0, 3, '#2a1830')
            c.rect(x0, y, x1 - x0, 1, '#4a2e5e')
            for x in range(x0 + 6, x1, 20):
                c.rect(x, y - 4, 2, 4, '#ffd27a')
    return c


def crowd():
    W, H = 640, 360
    c = Canvas(W, H)
    rnd = random.Random(42)
    base = H - 132
    for x in range(-6, W, 10):
        y = base + rnd.randint(0, 10)
        tone = rnd.random() > 0.5
        body_c, body_l = ('#1e1226', '#34203e') if tone else ('#2a1a34', '#3e2a4a')
        c.rect(x, y + 10, 12, H - y, body_c)                         # shoulders and body
        c.rect(x, y + 10, 12, 1, body_l)
        c.rect(x, y + 10, 1, 10, body_l)
        head = c.ellipse_mask(x + 6, y + 5, 4.5, 5)
        c.shade(head, x + 6, y + 5, 4.5, 5, [body_c, body_l, '#6a2a5a'], cuts=(0.1, 0.7))
        if rnd.random() > 0.55:                                      # hand in the air
            ax = x + (0 if rnd.random() > 0.5 else 10)
            c.rect(ax, y - 10, 2, 18, body_c)
            c.rect(ax - 1, y - 13, 4, 4, body_l)
    # Palms in front of the crowd.
    for px_, top in ((80, 150), (420, 130), (580, 170)):
        for y in range(top, H):
            dx = round(np.sin((y - top) / 28) * 4)
            seg = (y - top) % 8
            col = '#3a2418' if seg in (0, 7) else ('#5a3a24' if seg < 4 else '#4a301e')
            c.rect(px_ + dx, y, 7, 1, col)
            c.px(px_ + dx, y, '#7a5030')
            c.px(px_ + dx + 7, y, OUTLINE)
            c.px(px_ + dx - 1, y, OUTLINE)
        for ang in (-150, -115, -70, -30, 10, -90):
            a = np.radians(ang)
            for i in range(34):
                t = i / 34
                lx = px_ + 3 + np.cos(a) * i
                ly = top + np.sin(a) * i + (t ** 2) * 22
                w = max(1, int(5 * (1 - t)))
                for k in range(-w, w + 1):
                    col = '#2e7a3e' if k < 0 else ('#1e5a2e' if k < w else '#123a20')
                    c.px(int(lx), int(ly + k), col)
        c.fill(c.ellipse_mask(px_ + 4, top + 2, 5, 4), '#5a3a24')
    c.outline()
    return c


def water():
    c = Canvas(96, 80)
    dither_bands(c, ['#3a86e8', '#2a6ad0', '#1f5ab8', '#1a4ea2', '#163e8a'])
    for x in range(0, 96, 16):
        c.rect(x, 2, 8, 2, '#d8f0ff')
        c.rect(x + 8, 4, 6, 1, '#a4d4ff')
    for x, y in [(6, 24), (40, 36), (70, 20), (20, 54), (60, 62), (86, 46)]:
        c.rect(x, y, 6, 1, '#3a86e8')
        c.px(x + 2, y - 1, '#a4d4ff')
    c.rect(0, 0, 96, 1, OUTLINE)
    return c


def backgrounds():
    sky().save(os.path.join(OUT, 'bg-sky.png'))
    venue().save(os.path.join(OUT, 'bg-venue.png'))
    crowd().save(os.path.join(OUT, 'bg-crowd.png'))
    water().save(os.path.join(OUT, 'bg-water.png'))


if __name__ == '__main__':
    os.makedirs(OUT, exist_ok=True)
    tiles(); mango(); egg(); hearts(); goal(); duck_big(); backgrounds()
    print('saved to', os.path.normpath(OUT))
