"""Draws the intro story art: Boris's bedroom (cream and gold, like Sandro's reference), the bed, the door.

Same rules as world_art.py: drawn at the hero's pixel size (twice the world resolution), #150b22
outline, 3-step ramps lit from the top left; backdrops a little calmer than the sprites.

Outputs (default /mnt/project-files/intro/art, or the folder given as the first argument):
  bedroom.png       640 x 360 backdrop, one screen. Floor line at y=300 (world y=150).
  bed-back.png      headboard, mattress and pillows (Boris lies on top of this)
  bed-front.png     the duvet, throw and footboard (drawn over Boris)
  door-closed.png / door-open.png   the bedroom door, placed at DOOR_X, DOOR_Y on the backdrop

Run from the repo root:  python3 tools/intro_art.py [out_dir]   (needs Pillow and numpy)
"""
import os
import sys
import numpy as np
from pixelkit import Canvas, OUTLINE, rgb
from world_art import dither_bands, GOLD, BLUE, WHITE

W, H = 640, 360
FLOOR_Y = 300
DOOR_X, DOOR_Y = 556, 150          # top-left of the door sprites on the backdrop
BED_X, BED_Y = 52, 196              # top-left of both bed sprites on the backdrop

CREAM = ['#7a6450', '#a68e72', '#cbb89a', '#e6d8bf', '#f5ecdc']   # shadow .. lit
GILT = ['#7a4a14', '#b8863a', '#e0b45c', '#f5d890']               # soft gold trim
MARBLE = ['#8e8a90', '#b4b0b4', '#d4d0d2', '#ecebeb']
VEIN = '#9a96a6'
SKY = ['#f6a64a', '#ffd27a', '#fae8bf', '#fdf8ee']
FLOWER = ['#f6b8c8', '#fdfefd', '#3cae4a']
WARM = '#fff4cc'


def put(c, mask, col):
    c.a[mask] = rgb(col) + [255]


def box(c, x, y, w, h, ramp, outline=True):
    """A shaded block lit from the top left: highlight on top and left edges, shadow bottom and right."""
    c.rect(x, y, w, h, ramp[-2] if len(ramp) > 2 else ramp[-1])
    c.rect(x, y, w, 2, ramp[-1])
    c.rect(x, y, 2, h, ramp[-1])
    c.rect(x, y + h - 2, w, 2, ramp[0])
    c.rect(x + w - 2, y, 2, h, ramp[0])
    if outline:
        frame(c, x - 1, y - 1, w + 2, h + 2, OUTLINE)


def frame(c, x, y, w, h, col, t=1):
    c.rect(x, y, w, t, col); c.rect(x, y + h - t, w, t, col)
    c.rect(x, y, t, h, col); c.rect(x + w - t, y, t, h, col)


def outline_of(c, mask):
    p = np.pad(mask, 1)
    n = p[:-2, 1:-1] | p[2:, 1:-1] | p[1:-1, :-2] | p[1:-1, 2:]
    put(c, ~mask & n, OUTLINE)


def shade_mask(c, mask, ramp, t):
    """Fill a mask with a ramp by a 0..1 value t (0 = lit)."""
    idx = np.clip((t * len(ramp)).astype(int), 0, len(ramp) - 1)
    for i, col in enumerate(ramp[::-1]):
        put(c, mask & (idx == i), col)


def lamp(c, x, y):
    """A table lamp: cream pleated shade glowing warm, gold base."""
    shade = np.zeros((c.h, c.w), bool)
    for k in range(14):
        w_ = 7 + k // 2
        shade[y + k, x - w_:x + w_] = True
    ys, xs = np.mgrid[0:c.h, 0:c.w]
    shade_mask(c, shade, [WARM, CREAM[4], CREAM[3]], np.clip((ys - y) / 18 + (xs - x) / 40 + 0.2, 0, 0.99))
    put(c, shade & ((xs - x) % 4 == 0), CREAM[3])
    outline_of(c, shade)
    body = c.ellipse_mask(x, y + 21, 5, 6)
    c.shade(body, x, y + 21, 5, 6, GILT[1:], cuts=(-0.2, 0.4))
    outline_of(c, body)
    box(c, x - 6, y + 27, 12, 3, GILT)
    # Warm glow on the wall around the shade.
    glow = (np.hypot(xs - x, (ys - y - 6) * 1.3) < 34) & ~shade & ((xs + ys) % 2 == 0) & (c.a[..., 3] > 0)
    c.a[glow, :3] = np.clip(c.a[glow, :3].astype(int) + 14, 0, 255).astype(np.uint8)


def nightstand(c, x, w=44):
    top = FLOOR_Y - 46
    box(c, x, top, w, 38, CREAM)
    for k in range(2):
        frame(c, x + 4, top + 6 + k * 15, w - 8, 12, CREAM[1])
        c.rect(x + w // 2 - 2, top + 11 + k * 15, 4, 2, GILT[2])
    box(c, x + 2, top - 4, w - 4, 4, GILT)                     # gold top rim
    for lx in (x + 3, x + w - 6):
        box(c, lx, FLOOR_Y - 8, 3, 8, GILT, outline=False)
    lamp(c, x + w // 2, top - 34)


def chandelier(c, cx, top=18):
    """Gold chandelier with candle bulbs and crystal drops, hanging from a ceiling medallion."""
    med = c.ellipse_mask(cx, top + 2, 26, 6)
    c.shade(med, cx, top + 2, 26, 6, CREAM[2:], cuts=(-0.1, 0.5))
    for y in range(top + 4, top + 40):                                       # chain
        c.px(cx, y, GILT[2] if y % 3 else GILT[0])
    box(c, cx - 3, top + 40, 6, 22, GILT)                                     # stem
    ys, xs = np.mgrid[0:c.h, 0:c.w]
    for side in (-1, 1):
        for reach, dy in ((34, 0), (20, -10)):
            arm = (np.abs(ys - (top + 60 + dy - 6 * np.sin(np.clip((xs - cx) * side, 0, reach) / reach * np.pi))) <= 1) \
                & ((xs - cx) * side >= 0) & ((xs - cx) * side <= reach)
            put(c, arm, GILT[2])
            bx = cx + side * reach
            box(c, bx - 2, top + 50 + dy, 4, 8, CREAM[3:], outline=True)        # candle
            flame = c.ellipse_mask(bx, top + 46 + dy, 2, 3)
            put(c, flame, WARM); c.px(bx, top + 45 + dy, '#fdfefd')
            for k in range(3):                                                  # crystal drops
                c.px(bx, top + 62 + dy + k, '#fdfefd' if k == 0 else '#cfd8ec')
            glow = (np.hypot(xs - bx, ys - (top + 46 + dy)) < 16) & ((xs + ys) % 2 == 0)
            c.a[glow, :3] = np.clip(c.a[glow, :3].astype(int) + 18, 0, 255).astype(np.uint8)
    bowl = c.ellipse_mask(cx, top + 64, 14, 6) & (ys >= top + 62)
    c.shade(bowl, cx, top + 64, 14, 6, GILT[1:], cuts=(-0.1, 0.5))
    outline_of(c, bowl)
    for k in range(-2, 3):
        for j in range(4):
            c.px(cx + k * 5, top + 70 + j + abs(k), '#fdfefd' if j == 0 else '#cfd8ec')


COVERS = ['/mnt/project-files/intro/ref/cover-gravity.jpg', '/mnt/project-files/intro/ref/cover-purple-noise.jpg']
COVER_X, COVER_YS, COVER = 496, (50, 110), 40      # two framed record sleeves above the vanity


def vinyl_cover(path):
    """A record sleeve from a real cover photo, shrunk to 40 x 40 and reduced to 10 flat colors, in a thin gold frame."""
    from PIL import Image
    im = Image.open(path).convert('RGB')
    side = min(im.size)
    im = im.crop(((im.width - side) // 2, (im.height - side) // 2, (im.width + side) // 2, (im.height + side) // 2))
    im = im.resize((COVER, COVER), Image.LANCZOS).quantize(10, dither=Image.Dither.NONE).convert('RGB')
    c = Canvas(COVER + 6, COVER + 6)
    c.rect(0, 0, COVER + 6, COVER + 6, OUTLINE)
    c.rect(1, 1, COVER + 4, COVER + 4, GILT[2]); c.rect(1, 1, COVER + 4, 1, GILT[3]); c.rect(1, 1, 1, COVER + 4, GILT[3])
    c.rect(1, COVER + 4, COVER + 4, 1, GILT[1]); c.rect(COVER + 4, 1, 1, COVER + 4, GILT[1])
    c.a[3:3 + COVER, 3:3 + COVER, :3] = np.array(im)
    c.a[3:3 + COVER, 3:3 + COVER, 3] = 255
    return c


def bedroom():
    c = Canvas(W, H)
    ys, xs = np.mgrid[0:H, 0:W]
    # Ceiling with a warm cove light, crown moulding.
    c.rect(0, 0, W, 18, CREAM[3])
    c.rect(0, 12, W, 2, WARM)
    c.rect(0, 14, W, 4, CREAM[2]); c.rect(0, 18, W, 2, GILT[1]); c.rect(0, 20, W, 1, CREAM[1])
    # Wall: cream with gold-lined panels.
    c.rect(0, 21, W, FLOOR_Y - 21, CREAM[3])
    put(c, (ys > 21) & (ys < FLOOR_Y) & ((xs < 24) | (xs > W - 24)) & ((xs + ys) % 2 == 0), CREAM[2])
    for x0, x1 in ((0, 44), (276, 372), (474, 548), (622, 640)):
        frame(c, x0 + 6, 40, x1 - x0 - 12, 150, GILT[1])
        frame(c, x0 + 6, 204, x1 - x0 - 12, FLOOR_Y - 220, GILT[1])
    c.rect(0, 196, W, 3, CREAM[4]); c.rect(0, 199, W, 1, CREAM[1])      # chair rail
    # Skirting board.
    c.rect(0, FLOOR_Y - 12, W, 12, CREAM[4]); c.rect(0, FLOOR_Y - 12, W, 2, '#fdfefd')
    c.rect(0, FLOOR_Y - 3, W, 3, CREAM[2]); c.rect(0, FLOOR_Y - 13, W, 1, CREAM[1])

    # The arched lattice panel behind the bed, like the reference.
    ax0, ax1, atop = 44, 270, 36
    acx, half = (ax0 + ax1) / 2, (ax1 - ax0) / 2
    arch = (xs >= ax0) & (xs < ax1) & (ys < FLOOR_Y - 12)
    nx = np.abs(xs - acx) / half
    arch &= ys >= atop + 34 * (1 - np.sqrt(np.clip(1 - nx ** 2, 0, 1))) - 14 * np.clip(1 - nx * 5, 0, 1)
    put(c, arch, CREAM[2])
    lattice = arch & ((((xs - ys) % 12) == 0) | (((xs + ys) % 12) == 0))
    put(c, lattice, CREAM[3])
    put(c, arch & (((xs - ys) % 12) == 6) & (((xs + ys) % 12) == 6), GILT[2])
    inner = arch & ~(np.roll(arch, 6, 0) & np.roll(arch, -6, 1) & np.roll(arch, 6, 1))
    put(c, inner, GILT[1])
    outline_of(c, arch)

    # Painting of the mask in a gold frame.
    px_, py_, pw, ph = 290, 62, 68, 82
    box(c, px_, py_, pw, ph, GILT)
    c.rect(px_ + 5, py_ + 5, pw - 10, ph - 10, '#221533')
    mx, my = px_ + pw // 2, py_ + 46
    face = c.ellipse_mask(mx, my, 18, 20)
    c.shade(face, mx, my, 18, 20, WHITE, cuts=(-0.2, 0.4))
    for i in range(-2, 3):
        tx, ty = mx + i * 7, my - 34 + (6 if i % 2 else 0)
        for y in range(ty, my - 14):
            half_ = int((y - ty) * 0.35) + 1
            c.rect(tx - half_, y, half_ * 2, 1, GOLD[2] if y < ty + 8 else GOLD[1])
    c.rect(mx - 13, my - 4, 9, 5, BLUE[1]); c.rect(mx + 4, my - 4, 9, 5, BLUE[1])
    c.rect(mx - 11, my - 3, 5, 3, OUTLINE); c.rect(mx + 6, my - 3, 5, 3, OUTLINE)
    c.rect(mx - 5, my - 14, 10, 4, GOLD[2])

    # Chandelier in the middle of the room.
    chandelier(c, 158)

    # Tall window with sheer curtains and heavy cream drapes.
    wx, wy, ww, wh = 384, 44, 80, 236
    sky = Canvas(ww, wh)
    dither_bands(sky, SKY)
    c.a[wy:wy + wh, wx:wx + ww] = sky.a
    for x in range(wx, wx + ww, 6):                                          # sheer folds
        c.rect(x, wy, 2, wh, '#fdf8ee')
    for x, y, w_, h_ in [(wx - 4, wy - 4, ww + 8, 4), (wx - 4, wy + wh, ww + 8, 4)]:
        box(c, x, y, w_, h_, CREAM[2:], outline=False)
    for side in (0, 1):
        x0 = wx - 26 if side == 0 else wx + ww - 6
        for y in range(wy - 10, FLOOR_Y - 4):
            t = (y - wy) / (FLOOR_Y - wy)
            w_ = int(30 - 10 * np.sin(np.clip(t, 0, 1) * np.pi * 0.9))
            xa = x0 if side == 0 else x0 + 30 - w_
            for k in range(w_):
                fold = k % 9
                col = CREAM[4] if fold < 2 else (CREAM[3] if fold < 6 else CREAM[2])
                c.px(xa + k, y, col)
            c.px(xa - 1, y, OUTLINE); c.px(xa + w_, y, OUTLINE)
        c.rect(x0 + (2 if side == 0 else 6), wy + 120, 24, 4, GILT[2])        # tie-back
    box(c, wx - 34, wy - 16, ww + 68, 5, GILT)                               # curtain rod
    # Sunlight falling on the floor.
    beam = (ys >= FLOOR_Y + 2) & (xs >= wx - 20 - (ys - FLOOR_Y) * 0.9) & (xs <= wx + ww - (ys - FLOOR_Y) * 0.9) & ((xs + ys) % 2 == 0)

    # Two of Boris's records framed on the wall.
    for path, y in zip(COVERS, COVER_YS):
        if os.path.exists(path):
            cov = vinyl_cover(path)
            c.paste(cov, COVER_X - 3, y - 3)
            c.rect(COVER_X - 3, y + COVER + 3, COVER + 6, 1, CREAM[1])          # soft shadow under the frame
    # Vanity with a round gold mirror and flowers.
    vx, vw = 480, 64
    box(c, vx, FLOOR_Y - 44, vw, 6, CREAM[1:])
    for lx in (vx + 3, vx + vw - 7):
        box(c, lx, FLOOR_Y - 38, 4, 38, GILT, outline=False)
    frame(c, vx + 8, FLOOR_Y - 38, vw - 16, 10, CREAM[1])
    mir = c.ellipse_mask(vx + vw // 2, FLOOR_Y - 76, 18, 24)
    put(c, mir, GILT[2]); put(c, c.ellipse_mask(vx + vw // 2, FLOOR_Y - 76, 15, 21), '#cfd8ec')
    put(c, c.ellipse_mask(vx + vw // 2 - 5, FLOOR_Y - 84, 4, 8), '#fdfefd')
    outline_of(c, mir)
    vase = c.ellipse_mask(vx + 12, FLOOR_Y - 50, 4, 6)
    c.shade(vase, vx + 12, FLOOR_Y - 50, 4, 6, GILT[1:]); outline_of(c, vase)
    for fx, fy in [(-4, -62), (2, -64), (6, -59), (-1, -57), (-7, -58)]:
        f = c.ellipse_mask(vx + 12 + fx, FLOOR_Y + fy, 3, 3)
        put(c, f, FLOWER[0] if fx % 2 else FLOWER[1]); c.px(vx + 12 + fx, FLOOR_Y + fy, GILT[2])
    c.rect(vx + 9, FLOOR_Y - 58, 1, 4, FLOWER[2]); c.rect(vx + 14, FLOOR_Y - 58, 1, 4, FLOWER[2])

    # Nightstands with lamps either side of the bed.
    nightstand(c, 4)
    nightstand(c, 226)

    # Marble floor: big tiles in perspective with soft veins and a reflection band.
    fl = ys >= FLOOR_Y
    put(c, fl, MARBLE[2])
    put(c, fl & (ys < FLOOR_Y + 6), MARBLE[3])
    for y in (FLOOR_Y + 14, FLOOR_Y + 34):
        c.rect(0, y, W, 1, MARBLE[1])
    for k in range(-6, 14):
        x0 = k * 64
        line = fl & (np.abs(xs - (x0 + (ys - FLOOR_Y) * (x0 - 320) / 140)) < 0.6)
        put(c, line, MARBLE[1])
    put(c, beam, MARBLE[3])
    rnd = np.random.RandomState(3)
    for _ in range(26):
        x, y = rnd.randint(0, W), rnd.randint(FLOOR_Y + 3, H - 2)
        for k in range(rnd.randint(6, 16)):
            c.px(x + k, y + int(np.sin(k / 3) * 2), VEIN)
    # Reflections of the bright window and the gold furniture.
    c.rect(0, FLOOR_Y, W, 1, CREAM[1])
    # Ornate rug under the bed.
    rug = fl & (ys >= FLOOR_Y + 8) & (ys < FLOOR_Y + 40) & (xs > 18 - (ys - FLOOR_Y) * 0.6) & (xs < 300 + (ys - FLOOR_Y) * 0.6)
    put(c, rug, CREAM[3])
    border = rug & ~(np.roll(rug, 4, 0) & np.roll(rug, -4, 0) & np.roll(rug, 8, 1) & np.roll(rug, -8, 1))
    put(c, border, GILT[2])
    put(c, rug & ~border & (((xs // 2 + ys) % 10) == 0), CREAM[2])
    put(c, rug & ~border & ((xs - 160) ** 2 / 90 ** 2 + (ys - FLOOR_Y - 24) ** 2 / 9 ** 2 < 1) & ((xs + ys) % 3 == 0), GILT[1])
    outline_of(c, rug)
    # Door frame on the right (the door sprites go inside it).
    box(c, DOOR_X - 8, DOOR_Y - 10, 8, FLOOR_Y - DOOR_Y + 10, CREAM[1:])
    box(c, DOOR_X + 64, DOOR_Y - 10, 8, FLOOR_Y - DOOR_Y + 10, CREAM[1:])
    box(c, DOOR_X - 12, DOOR_Y - 16, 88, 8, CREAM[1:])
    c.rect(DOOR_X - 8, DOOR_Y - 18, 80, 2, GILT[2])
    c.rect(DOOR_X, DOOR_Y, 64, FLOOR_Y - DOOR_Y, '#221533')
    return c


def door(open_, from_outside=False):
    dh = FLOOR_Y - DOOR_Y
    c = Canvas(64, dh)
    if open_ and from_outside:
        # Looking into the bedroom: cream wall, a strip of gold panel, the marble floor.
        c.rect(0, 0, 64, dh, CREAM[3])
        put(c, (np.mgrid[0:dh, 0:64].sum(0) % 2 == 0) & (np.mgrid[0:dh, 0:64][1] < 20), CREAM[2])
        frame(c, 24, 20, 30, 60, GILT[1])
        c.rect(0, dh - 20, 64, 20, MARBLE[2]); c.rect(0, dh - 20, 64, 2, MARBLE[3]); c.rect(0, dh - 21, 64, 1, CREAM[1])
        box(c, 0, 0, 14, dh, CREAM[1:], outline=False)
        c.rect(14, 0, 1, dh, OUTLINE)
        c.rect(0, 0, 64, 1, OUTLINE)
        return c
    if not open_:
        box(c, 1, 1, 62, dh - 1, CREAM[1:], outline=False)
        for y0, h_ in ((10, 54), (72, dh - 84)):                         # two raised panels
            frame(c, 9, y0, 46, h_, GILT[1])
            frame(c, 10, y0 + 1, 44, h_ - 2, CREAM[4])
        handle = c.ellipse_mask(9, dh // 2 + 4, 3, 3)
        c.shade(handle, 9, dh // 2 + 4, 3, 3, GILT[1:])
        outline_of(c, handle)
        c.rect(6, dh // 2 + 7, 7, 2, GILT[2])
        frame(c, 0, 0, 64, dh + 1, OUTLINE)
    else:
        # Doorway full of bright morning light, the door swung open against the frame.
        dither_bands(c, ['#f6a64a', '#ffd27a', '#fae8bf', '#fdfefd'])
        ys, xs = np.mgrid[0:dh, 0:64]
        grass = ys > dh - 22
        put(c, grass, '#3cae4a'); put(c, grass & (ys == dh - 22), '#8ad860')
        put(c, (ys > dh - 12) & (np.abs(xs - 32) < 10 + (ys - dh + 12)), '#d0aa7c')
        box(c, 50, 0, 14, dh, CREAM[1:], outline=False)
        c.rect(49, 0, 1, dh, OUTLINE)
        c.rect(0, 0, 64, 1, OUTLINE)
    return c


def bed():
    """Two layers so Boris can lie inside: back (headboard, mattress, pillows) and front (duvet, footboard)."""
    bw, bh = 160, FLOOR_Y - BED_Y
    mt = 72                                                          # mattress top
    back, front = Canvas(bw, bh), Canvas(bw, bh)
    ys, xs = np.mgrid[0:bh, 0:bw]
    # Tall tufted headboard with a curved gold top.
    hb = (xs >= 2) & (xs < 20) & (ys >= mt - 52 + (xs - 11) ** 2 / 14) & (ys < bh - 8)
    shade_mask(back, hb, CREAM[1:], np.clip((xs - 2) / 18 + 0.1, 0, 0.99))
    put(back, hb & ((ys + (xs // 6) * 4) % 8 == 0) & ((xs - 2) % 6 == 3), CREAM[0])          # tufts
    put(back, hb & ~np.roll(hb, 2, 0), GILT[2])
    outline_of(back, hb)
    # Bed base with gold trim, mattress, pillows.
    box(back, 18, mt + 14, bw - 22, 14, CREAM[1:])
    back.rect(18, mt + 14, bw - 22, 2, GILT[2])
    box(back, 18, mt, bw - 30, 14, WHITE)
    for px, py, rx, ry, ramp in ((32, mt - 4, 13, 8, CREAM[2:]), (44, mt - 2, 12, 7, WHITE), (54, mt, 8, 5, GILT[1:])):
        pil = back.ellipse_mask(px, py, rx, ry)
        back.shade(pil, px, py, rx, ry, ramp, cuts=(-0.2, 0.45))
        outline_of(back, pil)
    for x in (22, bw - 16):
        box(back, x, mt + 28, 5, bh - mt - 29, GILT)                 # gold legs
    # Front: a thick cream duvet from the waist down with a gold throw across the foot.
    wave = np.round(np.sin((xs - 58) / 10.0)).astype(int)
    duvet = (xs >= 58) & (xs < bw - 12) & (ys >= mt - 8 + wave) & (ys < mt + 16)
    duvet |= (xs >= 58) & (xs < bw - 8) & (ys >= mt + 8) & (ys < mt + 22)
    shade_mask(front, duvet, [CREAM[4], CREAM[3], CREAM[2]], np.clip((ys - mt + 8) / 30, 0, 0.99))
    put(front, duvet & (ys == mt - 2 + wave), '#fdfefd')
    put(front, duvet & ((xs + ys * 2) % 14 == 0) & (ys > mt), GILT[2])             # damask dots
    throw = duvet & (xs >= bw - 52) & (xs < bw - 24)
    shade_mask(front, throw, GILT[1:][::-1], np.clip((ys - mt + 8) / 30, 0, 0.99))
    put(front, throw & (ys == mt + 21), GILT[0])
    outline_of(front, duvet)
    box(front, bw - 12, 26, 10, bh - 35, CREAM[1:])                 # upholstered footboard
    front.rect(bw - 12, 26, 10, 2, GILT[2])
    box(front, bw - 10, bh - 9, 5, 9, GILT, outline=False)
    return back, front


# ---------- outside: in front of Boris's villa by the sea ----------

GRASS = ['#123a20', '#1e5a2e', '#2e7a3e', '#3cae4a', '#8ad860']
SEA = ['#1a4ea2', '#2a6ad0', '#3a86e8', '#a4d4ff']
HILL = ['#4a2a4a', '#6a3a5a', '#8a4a62']
VILLA_DOOR_X = 40                     # the villa door Boris comes out of (door-open.png fits here too)


def palm(c, x, top, lean=4):
    for y in range(top, FLOOR_Y):
        dx = round(np.sin((y - top) / 30) * lean)
        seg = (y - top) % 8
        col = '#3a2418' if seg in (0, 7) else ('#7a5030' if seg < 4 else '#5a3a24')
        c.rect(x + dx, y, 8, 1, col)
        c.px(x + dx, y, '#a8723a'); c.px(x + dx - 1, y, OUTLINE); c.px(x + dx + 8, y, OUTLINE)
    for ang in (-160, -125, -80, -40, 5, -100):
        a = np.radians(ang)
        for i in range(40):
            t = i / 40
            lx, ly = x + 4 + np.cos(a) * i, top + np.sin(a) * i + (t ** 2) * 26
            w = max(1, int(5 * (1 - t)))
            for k in range(-w, w + 1):
                c.px(int(lx), int(ly + k), GRASS[3] if k < 0 else (GRASS[2] if k < w else GRASS[1]))
    c.fill(c.ellipse_mask(x + 5, top + 2, 6, 5), '#5a3a24')


def outside():
    c = Canvas(W, H)
    ys, xs = np.mgrid[0:H, 0:W]
    dither_bands(c, ['#6a8ad0', '#8aa6dc', '#b0c4e6', '#f6c8a8', '#ffd8a0', '#fae8bf'], top=0, height=210)
    sun = c.ellipse_mask(470, 178, 26, 26)
    c.shade(sun, 470, 178, 26, 26, ['#ffb85a', '#ffd27a', '#fff4cc'], light=(0, -1), cuts=(-0.1, 0.45))
    for cx, cy, w in [(150, 60, 70), (360, 40, 50), (560, 90, 60)]:
        m = c.ellipse_mask(cx, cy, w / 2, 7) | c.ellipse_mask(cx - w / 6, cy - 6, w / 4, 7)
        c.shade(m, cx, cy, w / 2, 10, ['#cfd8ec', '#fdf8ee', '#fdfefd'], light=(0, -1), cuts=(-0.1, 0.5))
    # Hills and the sea on the horizon.
    hills = ys > 196 - 18 * np.sin(xs / 90.0) ** 2 - 10 * np.sin(xs / 37.0 + 1) ** 2
    hills &= ys < 210
    put(c, hills, HILL[1]); put(c, hills & (ys < 200 - 18 * np.sin(xs / 90.0) ** 2), HILL[2])
    sea = (ys >= 206) & (ys < 236)
    shade_mask(c, sea, SEA[2::-1][::-1], np.clip((ys - 206) / 30, 0, 0.99))
    put(c, sea & (((xs + (ys - 206) * 7) % 23) < 3) & ((ys % 4) == 1), SEA[3])
    put(c, (ys >= 206) & (ys < 236) & (np.abs(xs - 470) < 30 - (ys - 206)) & ((xs + ys) % 3 == 0), '#ffd27a')   # sun glitter
    # Lawn up to the floor line, ground below.
    lawn = (ys >= 236) & (ys < FLOOR_Y)
    shade_mask(c, lawn, GRASS[3:0:-1], np.clip((ys - 236) / 64, 0, 0.99))
    rnd = np.random.RandomState(5)
    for _ in range(140):
        x, y = rnd.randint(0, W), rnd.randint(240, FLOOR_Y - 2)
        c.px(x, y, GRASS[4]); c.px(x, y + 1, GRASS[3])
    # White fence along the garden.
    for x in range(150, W, 18):
        box(c, x, 248, 8, 50, WHITE)
        for k in range(4):
            c.px(x + k, 247 - k + (0 if k < 4 else 0), WHITE[2]); c.px(x + 7 - k, 247 - k, WHITE[1])
    for y in (258, 282):
        box(c, 150, y, W - 150, 5, WHITE)
    # Ground: grass edge with soil and a stone path to the door.
    c.rect(0, FLOOR_Y, W, H - FLOOR_Y, '#5a3a24')
    shade_mask(c, ys >= FLOOR_Y, ['#7a5030', '#5a3a24', '#3a2418'], np.clip((ys - FLOOR_Y) / 60, 0, 0.99))
    c.rect(0, FLOOR_Y, W, 6, GRASS[3]); c.rect(0, FLOOR_Y, W, 2, GRASS[4])
    for x in range(0, W, 5):
        c.px(x, FLOOR_Y + 6 + (x * 7) % 3, GRASS[2])
    c.rect(0, FLOOR_Y - 1, W, 1, OUTLINE)
    for i, x in enumerate(range(0, W, 46)):
        st = c.ellipse_mask(x + 20, FLOOR_Y + 20 + (i % 2) * 8, 16, 6)
        c.shade(st, x + 20, FLOOR_Y + 20 + (i % 2) * 8, 16, 6, ['#8a6a50', '#b08a64', '#d0aa7c'], cuts=(-0.2, 0.45))
        outline_of(c, st)
    # Palms behind the fence.
    palm(c, 300, 150, 5)
    palm(c, 560, 120, -4)
    # The villa on the left: cream wall, gold trim, a lamp and a potted plant.
    vw = 140
    c.rect(0, 70, vw, FLOOR_Y - 70, CREAM[3])
    put(c, (ys >= 70) & (ys < FLOOR_Y) & (xs < vw) & ((xs // 20 + ys // 10) % 2 == 0) & (ys % 10 == 0), CREAM[2])   # stone courses
    c.rect(0, 62, vw + 10, 10, CREAM[4]); c.rect(0, 70, vw + 10, 2, GILT[2]); c.rect(0, 72, vw + 10, 2, CREAM[1])
    c.rect(vw, 72, 4, FLOOR_Y - 72, CREAM[1]); c.rect(vw + 4, 62, 1, FLOOR_Y - 62, OUTLINE)
    c.rect(0, 61, vw + 11, 1, OUTLINE)
    box(c, VILLA_DOOR_X - 8, DOOR_Y - 16, 88, 8, CREAM[1:])
    box(c, VILLA_DOOR_X - 8, DOOR_Y - 8, 8, FLOOR_Y - DOOR_Y + 8, CREAM[1:])
    box(c, VILLA_DOOR_X + 64, DOOR_Y - 8, 8, FLOOR_Y - DOOR_Y + 8, CREAM[1:])
    c.rect(VILLA_DOOR_X, DOOR_Y, 64, FLOOR_Y - DOOR_Y, '#221533')
    # Wall lantern next to the door.
    box(c, 118, 150, 10, 16, GILT)
    c.rect(120, 153, 6, 10, WARM)
    # Potted olive tree by the wall.
    box(c, 112, FLOOR_Y - 22, 22, 22, ['#8a3e1a', '#b8642a', '#e08a50'])
    bush = c.ellipse_mask(123, FLOOR_Y - 40, 16, 14)
    c.shade(bush, 123, FLOOR_Y - 40, 16, 14, GRASS[1:4], cuts=(-0.2, 0.4))
    outline_of(c, bush)
    return c


# ---------- the note, the letter, the dialog box and the skip button ----------

PAPER = ['#a68e72', '#cbb89a', '#e6d8bf', '#f5ecdc']
INK = '#221533'
VELVET = ['#4a1438', '#7a2452', '#a83a6a']
UI_FILL = '#221533'
SKIP_GLYPHS = {
    'S': ['.####', '#....', '.###.', '....#', '####.'],
    'K': ['#..#.', '#.#..', '##...', '#.#..', '#..#.'],
    'I': ['###', '.#.', '.#.', '.#.', '###'],
    'P': ['####.', '#...#', '####.', '#....', '#....'],
}


def note_ground():
    """The folded note lying on the grass, with a tiny crown seal."""
    c = Canvas(18, 12)
    pts = [(2, 4), (14, 2), (16, 9), (4, 11)]
    ys, xs = np.mgrid[0:12, 0:18]
    def side(a, b):
        return (b[0] - a[0]) * (ys - a[1]) - (b[1] - a[1]) * (xs - a[0])
    m = np.ones((12, 18), bool)
    for i in range(4):
        m &= side(pts[i], pts[(i + 1) % 4]) >= 0
    shade_mask(c, m, PAPER[3:0:-1], np.clip((ys - 2) / 10 + (xs - 2) / 40, 0, 0.99))
    put(c, m & (np.abs(side((3, 7), (15, 5))) < 6), PAPER[1])          # fold line
    c.rect(8, 5, 3, 3, VELVET[1]); c.px(9, 5, GOLD[2])                  # wax seal with a crown dot
    outline_of(c, m)
    return c


def letter():
    """The big close-up of the note. The game writes the text on it (Press Start 2P), inside TEXT_BOX."""
    w, h = 420, 250
    c = Canvas(w, h)
    ys, xs = np.mgrid[0:h, 0:w]
    edge = (np.sin(xs / 7.0) * 1.5 + np.sin(xs / 3.1) * 0.8).astype(int)
    edge_x = (np.sin(ys / 6.0) * 1.5 + np.sin(ys / 2.7) * 0.8).astype(int)
    m = (ys >= 4 + edge) & (ys < h - 4 + edge) & (xs >= 4 + edge_x) & (xs < w - 4 + edge_x)
    shade_mask(c, m, [PAPER[2], PAPER[3]], np.clip(((xs - w / 2) ** 2 / (w / 2) ** 2 + (ys - h / 2) ** 2 / (h / 2) ** 2) * 0.55 + ((xs + ys) % 2) * 0.12, 0, 0.99))
    # Fold creases.
    put(c, m & (np.abs(xs - w // 2) < 1), PAPER[1]); put(c, m & (xs == w // 2 + 1), PAPER[3])
    put(c, m & (np.abs(ys - h // 2) < 1), PAPER[1])
    # A velvet-rope border, like the rope at a club door.
    rope = m & ~(np.roll(m, 10, 0) & np.roll(m, -10, 0) & np.roll(m, 10, 1) & np.roll(m, -10, 1))
    rope &= ~(np.roll(m, 6, 0) & np.roll(m, -6, 0) & np.roll(m, 6, 1) & np.roll(m, -6, 1)) == False
    inner = m & ~(np.roll(m, 12, 0) & np.roll(m, -12, 0) & np.roll(m, 12, 1) & np.roll(m, -12, 1))
    band = inner & (np.roll(m, 7, 0) & np.roll(m, -7, 0) & np.roll(m, 7, 1) & np.roll(m, -7, 1))
    put(c, band, VELVET[1]); put(c, band & ((xs + ys) % 6 < 2), VELVET[2]); put(c, band & ((xs + ys) % 6 == 5), VELVET[0])
    for x, y in ((14, 14), (w - 16, 14), (14, h - 16), (w - 16, h - 16)):  # brass posts in the corners
        post = c.ellipse_mask(x, y, 5, 5)
        c.shade(post, x, y, 5, 5, GOLD[1:4]); outline_of(c, post)
    # Wax seal with a crown, bottom right.
    sx, sy = w - 52, h - 50
    seal = c.ellipse_mask(sx, sy, 17, 16)
    c.shade(seal, sx, sy, 17, 16, VELVET, cuts=(-0.2, 0.4)); outline_of(c, seal)
    for i in range(-1, 2):
        tx, ty = sx + i * 7, sy - 9 + (3 if i else 0)
        for y in range(ty, sy + 2):
            hw = int((y - ty) * 0.4) + 1
            c.rect(tx - hw, y, hw * 2, 1, GOLD[2])
    c.rect(sx - 10, sy + 2, 21, 4, GOLD[1])
    outline_of(c, m)
    return c


LETTER_TEXT_BOX = (30, 28, 330, 190)       # x, y, w, h on letter.png where the game writes the note


def dialog_frame():
    """9-slice frame for speech and dialog boxes: 24 x 24, corners 8 px. Dark fill, gold rim, cut corners."""
    c = Canvas(24, 24)
    c.rect(1, 1, 22, 22, UI_FILL)
    frame(c, 2, 2, 20, 20, GILT[2], t=2)
    c.rect(2, 2, 20, 1, GILT[3]); c.rect(2, 2, 1, 20, GILT[3])
    c.rect(2, 21, 20, 1, GILT[1]); c.rect(21, 2, 1, 20, GILT[1])
    frame(c, 0, 0, 24, 24, OUTLINE)
    for x, y in ((0, 0), (23, 0), (0, 23), (23, 23)):
        c.a[y, x, 3] = 0
    return c


def bubble_tail():
    """The little tail under a speech bubble, pointing down at the speaker. Overlaps the frame's bottom edge by 3 px."""
    c = Canvas(16, 12)
    for y in range(12):
        x0, x1 = 2 + y // 2, 14 - y
        if x1 - x0 < 1:
            c.rect(x0 - 1, y, 2, 1, OUTLINE)
            break
        c.rect(x0, y, x1 - x0, 1, UI_FILL)
        if y >= 3:
            c.rect(x0, y, 2, 1, GILT[2]); c.rect(x1 - 2, y, 2, 1, GILT[1])
            c.px(x0 - 1, y, OUTLINE); c.px(x1, y, OUTLINE)
    return c


def next_arrow(frame):
    c = Canvas(10, 9)
    dy = frame
    for i in range(5):
        c.rect(1 + i, 1 + i + dy, 8 - 2 * i, 1, GILT[3] if i < 2 else GILT[2])
    c.outline()
    return c


def skip_button():
    """A small 'SKIP' pill with a play arrow, for the top-right corner."""
    c = Canvas(52, 18)
    ys, xs = np.mgrid[0:18, 0:52]
    m = (((xs - 8) ** 2 / 64 + (ys - 9) ** 2 / 64 <= 1) | ((xs - 43) ** 2 / 64 + (ys - 9) ** 2 / 64 <= 1) | ((xs >= 8) & (xs <= 43) & (ys >= 1) & (ys <= 16)))
    put(c, m, UI_FILL)
    rim = m & ~(np.roll(m, 1, 0) & np.roll(m, -1, 0) & np.roll(m, 1, 1) & np.roll(m, -1, 1))
    put(c, rim, GILT[2])
    x = 8
    for ch in 'SKIP':
        g = SKIP_GLYPHS[ch]
        for gy, row in enumerate(g):
            for gx, v in enumerate(row):
                if v == '#':
                    c.px(x + gx, 7 + gy, '#fdfefd')
        x += len(g[0]) + 1
    for i in range(5):                                       # play arrow
        c.rect(x + 3, 7 + i, 1 + (2 - abs(i - 2)), 1, GILT[3])
    outline_of(c, m)
    return c


def main():
    out = sys.argv[1] if len(sys.argv) > 1 else '/mnt/project-files/intro/art'
    os.makedirs(out, exist_ok=True)
    bedroom().save(os.path.join(out, 'bedroom.png'))
    back, front = bed()
    back.save(os.path.join(out, 'bed-back.png'))
    front.save(os.path.join(out, 'bed-front.png'))
    door(False).save(os.path.join(out, 'door-closed.png'))
    door(True).save(os.path.join(out, 'door-open.png'))
    outside().save(os.path.join(out, 'outside.png'))
    door(True, from_outside=True).save(os.path.join(out, 'villa-door-open.png'))
    note_ground().save(os.path.join(out, 'note.png'))
    letter().save(os.path.join(out, 'letter.png'))
    dialog_frame().save(os.path.join(out, 'dialog-frame.png'))
    bubble_tail().save(os.path.join(out, 'bubble-tail.png'))
    for f in range(2):
        next_arrow(f).save(os.path.join(out, f'next-arrow-{f}.png'))
    skip_button().save(os.path.join(out, 'skip-button.png'))
    print('saved to', out)


if __name__ == '__main__':
    main()
