"""Draws the afterparty extras: the golden chicken nugget won in the VIP room, the ticket to the
afterparty (unlocked with all 10 nuggets) and the afterparty room, a club with a small stage,
CDJs and speaker stacks where all the DJs hang out.

Same rules as world_art.py: drawn at the hero's pixel size (twice the world resolution), #150b22
outline, ramps lit from the top left.

Outputs (default /mnt/project-files/art/afterparty, or the folder given as the first argument):
  nugget.png, nugget-shine-0..2.png   22 x 18 golden nugget (plain, and three frames with a glint sweeping over)
  nugget-icon.png, nugget-slot.png    12 x 10 HUD icon, and the empty slot for a nugget not won yet
  ticket.png, ticket-locked.png       120 x 64 golden afterparty ticket, and the grey locked one
  room.png                            640 x 360 afterparty room backdrop, floor at y=300
  booth.png                           the DJ table with CDJs and mixer, drawn over the DJ who plays (at BOOTH_SPRITE)
  booth-glow-0..1.png                 the CDJ platters and mixer lights, two frames to blink over the booth
  preview.png                         the room with DJ spots marked, the ticket and the nuggets, at 2x

Run from the repo root:  python3 tools/afterparty_art.py [out_dir]   (needs Pillow and numpy)
"""
import os
import sys
import numpy as np
from PIL import Image
from pixelkit import Canvas, OUTLINE, rgb
from intro_art import put, box, frame, outline_of, GILT, UI_FILL
from bonus_art import GLYPHS, PURPLE, NEON, TEAL, STEEL, WHITE

GLYPHS.update({
    'A': ['.#.', '#.#', '###', '#.#', '#.#'], 'F': ['###', '#..', '##.', '#..', '#..'],
    'Y': ['#.#', '#.#', '.#.', '.#.', '.#.'], 'D': ['##.', '#.#', '#.#', '#.#', '##.'],
    'O': ['###', '#.#', '#.#', '#.#', '###'], 'N': ['#.#', '###', '###', '###', '#.#'],
    ' ': ['...', '...', '...', '...', '...'],
})

W, H = 640, 360
FLOOR_Y = 300
NUG = ['#7a4a14', '#b8761a', '#e0a83a', '#f5d36a', '#fff4cc']    # crust: shadow .. glint
GREY = ['#3a3442', '#5a5466', '#7a7486', '#9a96a6']
DARK = ['#0a090d', '#141218', '#221f28', '#34303c']


def text(c, s, x, y, col, scale=1):
    for ch in s:
        for gy, row in enumerate(GLYPHS[ch]):
            for gx, v in enumerate(row):
                if v == '#':
                    c.rect(x + gx * scale, y + gy * scale, scale, scale, col)
        x += 4 * scale


def text_w(s, scale=1):
    return len(s) * 4 * scale - scale


# ---------- the golden nugget ----------

def nugget_mask(c, ox, oy, sx=1.0):
    """A lumpy nugget: an oval with a few bumps, like a real chicken nugget."""
    ys, xs = np.mgrid[0:c.h, 0:c.w]
    m = (((xs + .5 - ox - 11) / (10 * sx)) ** 2 + ((ys + .5 - oy - 9.5) / 7.5) ** 2) <= 1
    for bx, by, r in ((5, 5, 4), (16, 4.5, 4.5), (19, 10, 3.5), (4, 12, 3.5), (11, 3.5, 3.5)):
        m |= ((xs + .5 - ox - 11 - (bx - 11) * sx) ** 2 + (ys + .5 - oy - by) ** 2) <= r * r
    m &= (ys >= oy + 1) & (ys < oy + 17)
    return m


def nugget(shine=None):
    c = Canvas(22, 18)
    m = nugget_mask(c, 0, 0)
    c.shade(m, 9, 7, 11, 9, NUG[:4], cuts=(-0.5, 0.0, 0.55))
    ys, xs = np.mgrid[0:18, 0:22]
    # Breaded crumbs: little darker and lighter specks.
    put(c, m & ((xs * 7 + ys * 5) % 11 == 0), NUG[1])
    put(c, m & ((xs * 3 + ys * 7) % 13 == 0) & (xs + ys < 20), NUG[4])
    if shine is not None:
        band = m & (np.abs((xs - ys * 0.6) - (2 + shine * 8)) < 1.2)
        put(c, band, NUG[4])
    outline_of(c, m)
    if shine == 1:                                    # a little sparkle off the top right
        for d in (-2, -1, 1, 2):
            c.px(18 + d, 2, '#fdfefd'); c.px(18, 2 + d, '#fdfefd')
        c.px(18, 2, NUG[4])
    return c


def nugget_icon(empty):
    """The small HUD icon (12 x 10), or the dark empty slot."""
    c = Canvas(12, 10)
    ys, xs = np.mgrid[0:10, 0:12]
    m = (((xs + .5 - 6) / 5.2) ** 2 + ((ys + .5 - 5.2) / 3.8) ** 2) <= 1
    m |= ((xs + .5 - 3) ** 2 + (ys + .5 - 3) ** 2) <= 4.5
    m |= ((xs + .5 - 8.5) ** 2 + (ys + .5 - 2.8) ** 2) <= 4.5
    m &= (ys >= 1) & (ys < 9) & (xs >= 1) & (xs < 11)
    if empty:
        put(c, m, PURPLE[2]); put(c, m & (ys < 4), PURPLE[3])
    else:
        c.shade(m, 5, 4, 6, 5, NUG[:4], cuts=(-0.5, 0.0, 0.55))
        c.px(3, 3, NUG[4])
    outline_of(c, m)
    return c


# ---------- the ticket ----------

def ticket(locked):
    """A golden ticket with bitten corners, a torn-off stub on the right and AFTER PARTY on it."""
    w, h = 120, 64
    c = Canvas(w, h)
    ys, xs = np.mgrid[0:h, 0:w]
    ramp = GREY if locked else [GILT[0], GILT[1], GILT[2], GILT[3]]
    card = (xs >= 1) & (xs < w - 1) & (ys >= 1) & (ys < h - 1)
    for cx, cy in ((1, 1), (w - 1, 1), (1, h - 1), (w - 1, h - 1)):
        card &= ((xs + .5 - cx) ** 2 + (ys + .5 - cy) ** 2) > 36
    stub_x = 90
    for cy in (1, h - 1):                              # bites where the stub tears off
        card &= ((xs + .5 - stub_x) ** 2 + (ys + .5 - cy) ** 2) > 16
    put(c, card, ramp[2])
    put(c, card & ((xs + ys) % 9 == 0), ramp[3])      # foil sparkle
    put(c, card & (ys < 4), ramp[3]); put(c, card & (ys >= h - 4), ramp[1])
    # Inner frame and the dashed tear line.
    inner = (xs >= 6) & (xs < stub_x - 4) & (ys >= 6) & (ys < h - 6)
    edge = inner & ~((xs >= 7) & (xs < stub_x - 5) & (ys >= 7) & (ys < h - 7))
    put(c, edge, ramp[0])
    put(c, card & (xs == stub_x) & (ys % 4 < 2) & (ys > 4) & (ys < h - 4), ramp[0])
    ink = '#2a1a10' if not locked else GREY[0]
    for i, word in enumerate(('AFTER', 'PARTY')):
        x = 6 + (stub_x - 10 - text_w(word, 3)) // 2 + 2
        text(c, word, x, 12 + i * 21, ink, scale=3)
    # The stub: a star, and ADMIT ONE written small.
    sx, sy = stub_x + 15, 24
    for r, col in ((6, ramp[0]), (4, ramp[3] if not locked else ramp[1])):
        for k in range(-r, r + 1):
            c.px(sx + k, sy, col); c.px(sx, sy + k, col)
        for k in range(-r // 2, r // 2 + 1):
            c.px(sx + k, sy + k, col); c.px(sx + k, sy - k, col)
    for i, word in enumerate(('ADMIT', 'ONE')):
        text(c, word, sx - text_w(word) // 2, 38 + i * 7, ink)
    outline_of(c, card)
    if locked:
        lx, ly = 46, 26                                # padlock over the middle
        sh = (((xs + .5 - lx) / 8) ** 2 + ((ys + .5 - ly) / 8) ** 2 <= 1) & (((xs + .5 - lx) / 5) ** 2 + ((ys + .5 - ly) / 5) ** 2 > 1) & (ys < ly + 2)
        body = (xs >= lx - 10) & (xs < lx + 10) & (ys >= ly + 2) & (ys < ly + 18)
        put(c, sh, STEEL[2]); put(c, body, STEEL[2]); put(c, body & (ys < ly + 4), STEEL[3]); put(c, body & (ys >= ly + 15), STEEL[1])
        c.rect(lx - 1, ly + 7, 3, 6, DARK[0])
        outline_of(c, sh | body)
    return c


# ---------- the room ----------

STAGE = (196, 444, 262)            # x0, x1, top of the stage (its front runs down to the floor)
BOOTH = (262, 378, 226)            # the DJ table on the stage: x0, x1, top
BOOTH_DJ = (320, 252)              # feet x, y for the DJ who plays: draw him first, then booth.png over him
DJ_SPOTS = [(40, 300), (98, 300), (156, 300), (484, 300), (542, 300), (600, 300),
            (110, 348), (250, 348), (390, 348), (530, 348)]   # feet x, y for the 10 DJs hanging out
PLATTERS = [(282, 222), (358, 222)]  # centres of the two CDJ jog wheels (seen a little from the front)


def speaker_stack(c, x0, y_floor, boxes):
    """Black club speakers stacked up, each with a big woofer and a horn on top."""
    ys, xs = np.mgrid[0:c.h, 0:c.w]
    y = y_floor
    for bw, bh, kind in boxes:
        y -= bh
        bx = x0 + (44 - bw) // 2
        box(c, bx, y, bw, bh, DARK[1:])
        cx, cy = bx + bw / 2, y + bh / 2
        if kind == 'sub':
            r = np.hypot(xs + .5 - cx, ys + .5 - cy)
            put(c, r < bh / 2 - 3, STEEL[1]); put(c, r < bh / 2 - 5, DARK[0]); put(c, (r < bh / 2 - 5) & (r > bh / 2 - 8), DARK[2]); put(c, r < 3, STEEL[1])
        else:
            c.rect(bx + 6, y + 4, bw - 12, 6, STEEL[1]); c.rect(bx + 8, y + 5, bw - 16, 4, DARK[0])
            r = np.hypot(xs + .5 - cx, ys + .5 - (y + bh - 11))
            put(c, r < 7, STEEL[1]); put(c, r < 5.5, DARK[0]); put(c, r < 2, STEEL[1])
        c.rect(bx + 3, y + bh - 4, 2, 1, TEAL[3])


def room():
    c = Canvas(W, H)
    ys, xs = np.mgrid[0:H, 0:W]
    # Back wall: deep purple with vertical neon strips and a soft glow behind the stage.
    put(c, ys < FLOOR_Y, PURPLE[1])
    put(c, (ys < FLOOR_Y) & ((xs + ys) % 2 == 0) & (np.abs(xs - 320) < 210) & (ys > 60), PURPLE[2])
    put(c, (ys < FLOOR_Y) & (np.abs(xs - 320) < 150) & (ys > 80), PURPLE[2])
    for x in (24, 88, 552, 616):
        c.rect(x - 1, 70, 3, 200, NEON[0]); c.rect(x, 70, 1, 200, NEON[2])
    # LED wall behind the booth: a grid of coloured dots spelling a wave.
    lx0, lx1, ly0, ly1 = 216, 424, 70, 196
    c.rect(lx0 - 4, ly0 - 4, lx1 - lx0 + 8, ly1 - ly0 + 8, DARK[0])
    frame(c, lx0 - 5, ly0 - 5, lx1 - lx0 + 10, ly1 - ly0 + 10, OUTLINE)
    wave_cols = [TEAL[2], TEAL[3], NEON[1], NEON[2], GILT[2]]
    for gx in range(lx0, lx1, 4):
        for gy in range(ly0, ly1, 4):
            u = (gx - lx0) / (lx1 - lx0)
            crest = ly0 + 60 + 34 * np.sin(u * 2 * np.pi * 1.5)
            d = gy - crest
            if 0 <= d < 26:
                col = wave_cols[int(d // 6) % 5]
            elif (gx // 4 + gy // 4) % 7 == 0:
                col = PURPLE[3]
            else:
                col = '#1c1428'
            c.rect(gx, gy, 3, 3, col)
    # Ceiling truss with lights and beams.
    c.rect(0, 0, W, 40, '#0c0814')
    c.rect(0, 30, W, 6, STEEL[1]); c.rect(0, 30, W, 1, STEEL[3]); c.rect(0, 35, W, 1, STEEL[0])
    for x in range(0, W, 12):
        for k in range(6):
            c.px(x + k, 30 + k % 6, STEEL[2]); c.px(x + 11 - k, 30 + k % 6, STEEL[2])
    beam_cols = [TEAL[3], NEON[2], GILT[3], TEAL[3], NEON[2], GILT[3]]
    for i, lx in enumerate((60, 160, 260, 380, 480, 580)):
        box(c, lx - 6, 36, 12, 10, DARK[1:])
        c.rect(lx - 3, 44, 6, 2, beam_cols[i])
        tx = 320 + (lx - 320) * 0.25
        cone = (ys > 46) & (ys < FLOOR_Y) & (np.abs(xs - (lx + (tx - lx) * (ys - 46) / 254)) < 2 + (ys - 46) * 0.09)
        put(c, cone & ((xs + ys) % 4 == 0), beam_cols[i])
    # Mirror ball.
    r = np.hypot(xs + .5 - 320, ys + .5 - 58)
    c.rect(319, 36, 2, 10, STEEL[2])
    ball = r < 11
    put(c, ball, STEEL[2]); put(c, ball & ((xs // 3 + ys // 3) % 2 == 0), STEEL[3]); put(c, ball & (xs + ys > 386), STEEL[1])
    put(c, ball & (xs < 316) & (ys < 54), WHITE)
    outline_of(c, ball)
    # Dance floor: glowing checker tiles running to the front.
    floor = ys >= FLOOR_Y
    tile = ((xs // 32) + ((ys - FLOOR_Y) // 12)) % 2
    put(c, floor, PURPLE[2]); put(c, floor & (tile == 1), '#3a2a52')
    put(c, floor & (tile == 1) & ((xs // 32) % 5 == 2), '#4a2a5a')
    put(c, floor & (((xs % 32) == 0) | (((ys - FLOOR_Y) % 12) == 0)), PURPLE[1])
    c.rect(0, FLOOR_Y, W, 1, OUTLINE)
    # The stage: black top, front face with a gold trim and steps in the middle.
    sx0, sx1, st = STAGE
    box(c, sx0, st, sx1 - sx0, 6, DARK[1:])
    c.rect(sx0, st + 6, sx1 - sx0, FLOOR_Y - st - 6, DARK[1])
    put(c, (xs >= sx0) & (xs < sx1) & (ys >= st + 6) & (ys < FLOOR_Y) & ((xs + ys) % 6 == 0), DARK[2])
    c.rect(sx0, st + 6, sx1 - sx0, 2, GILT[1]); c.rect(sx0, st + 6, sx1 - sx0, 1, GILT[3])
    for i in range(3):
        sy = st + 12 + i * 10
        box(c, 296 - i * 6, sy, 48 + i * 12, FLOOR_Y - sy, DARK[1:])
    frame(c, sx0 - 1, st - 1, sx1 - sx0 + 2, FLOOR_Y - st + 1, OUTLINE)
    # Speaker stacks on the stage corners.
    stack = [(44, 34, 'sub'), (44, 34, 'sub'), (36, 30, 'top')]
    speaker_stack(c, sx0 + 4, st, stack)
    speaker_stack(c, sx1 - 48, st, stack)
    return c


BOOTH_SPRITE = (256, 216)          # top-left of booth.png on the room


def booth():
    """The DJ booth as its own sprite, drawn OVER the DJ who plays: a black table with a lit strip, two CDJs, a mixer."""
    full = Canvas(W, H)
    bx0, bx1, bt = BOOTH
    st = STAGE[2]
    box(full, bx0, bt + 6, bx1 - bx0, st - bt - 6, DARK[1:])
    full.rect(bx0 + 10, bt + 18, bx1 - bx0 - 20, 4, NEON[1]); full.rect(bx0 + 10, bt + 18, bx1 - bx0 - 20, 1, NEON[3])
    for px_, _ in PLATTERS:
        box(full, px_ - 16, bt - 2, 32, 8, STEEL[:3])
    box(full, 306, bt - 2, 28, 8, DARK[1:])
    booth_lights(full, 0)
    x0, y0 = BOOTH_SPRITE
    out = Canvas(W - x0 - (W - bx1 - 6), st - y0)
    out.a[:] = full.a[y0:st, x0:x0 + out.w]
    return out


def booth_lights(c, f):
    bt = BOOTH[2]
    for i, (px_, _) in enumerate(PLATTERS):
        c.rect(px_ - 10, bt - 1, 20, 3, DARK[0])
        on = (f + i) % 2
        c.rect(px_ - 10 + (6 if on else 12), bt - 1, 4, 1, TEAL[3])
        c.rect(px_ - 13, bt + 2, 2, 2, GILT[3] if on else GILT[1])
    for k in range(4):
        c.rect(309 + k * 6, bt, 3, 2 if (k + f) % 2 else 1, [TEAL[3], NEON[2], GILT[3], TEAL[3]][k])


def booth_glow(f):
    """Just the booth top, to draw over room.png and blink (the lights change between frames)."""
    bx0, bx1, bt = BOOTH
    c = Canvas(W, H)
    booth_lights(c, f)
    m = c.a[..., 3] > 0
    ys, xs = np.where(m)
    x0, y0, x1, y1 = xs.min(), ys.min(), xs.max() + 1, ys.max() + 1
    out = Canvas(x1 - x0, y1 - y0)
    out.a[:] = c.a[y0:y1, x0:x1]
    return out, (int(x0), int(y0))


def preview(out):
    base = Image.open(os.path.join(out, 'room.png')).convert('RGBA')
    hero = os.path.join(os.path.dirname(__file__), '..', 'src', 'art', 'hero', 'idle.png')
    sol = '/mnt/project-files/art/solomun/png/solomun-photo-pose.png'
    figs = [Image.open(p).convert('RGBA') for p in (sol, hero) if os.path.exists(p)]
    from PIL import ImageDraw
    d = ImageDraw.Draw(base)
    for i, (x, y) in enumerate(DJ_SPOTS):
        d.ellipse((x - 14, y - 3, x + 14, y + 3), outline=(255, 216, 122, 255))
        d.text((x - 3, y + 4), str(i + 1), fill=(255, 216, 122, 255))
    if figs:
        s = figs[0]; x, y = BOOTH_DJ
        base.alpha_composite(s, (x - s.width // 2, y - s.height))
        if len(figs) > 1:
            b = figs[1]; x, y = DJ_SPOTS[7]
            base.alpha_composite(b, (x - b.width // 2, y - b.height))
    base.alpha_composite(Image.open(os.path.join(out, 'booth.png')), BOOTH_SPRITE)
    big = base.resize((W * 2, H * 2), Image.NEAREST)
    t = Image.open(os.path.join(out, 'ticket.png')).resize((240, 128), Image.NEAREST)
    tl = Image.open(os.path.join(out, 'ticket-locked.png')).resize((240, 128), Image.NEAREST)
    n = Image.open(os.path.join(out, 'nugget-shine-1.png')).resize((88, 72), Image.NEAREST)
    strip = Image.new('RGBA', (W * 2, 160), (21, 11, 34, 255))
    strip.alpha_composite(t, (20, 16)); strip.alpha_composite(tl, (280, 16)); strip.alpha_composite(n, (560, 44))
    for k in range(10):
        ic = Image.open(os.path.join(out, 'nugget-icon.png' if k < 7 else 'nugget-slot.png')).resize((36, 30), Image.NEAREST)
        strip.alpha_composite(ic, (690 + k * 40, 64))
    full = Image.new('RGBA', (W * 2, H * 2 + 160))
    full.alpha_composite(big, (0, 0)); full.alpha_composite(strip, (0, H * 2))
    return full


def main():
    out = sys.argv[1] if len(sys.argv) > 1 else '/mnt/project-files/art/afterparty'
    os.makedirs(out, exist_ok=True)
    nugget().save(os.path.join(out, 'nugget.png'))
    for f in range(3):
        nugget(f).save(os.path.join(out, f'nugget-shine-{f}.png'))
    nugget_icon(False).save(os.path.join(out, 'nugget-icon.png'))
    nugget_icon(True).save(os.path.join(out, 'nugget-slot.png'))
    ticket(False).save(os.path.join(out, 'ticket.png'))
    ticket(True).save(os.path.join(out, 'ticket-locked.png'))
    room().save(os.path.join(out, 'room.png'))
    booth().save(os.path.join(out, 'booth.png'))
    for f in (0, 1):
        g, pos = booth_glow(f)
        g.save(os.path.join(out, f'booth-glow-{f}.png'))
    print('booth glow at', pos)
    preview(out).save(os.path.join(out, 'preview.png'))
    print('saved to', out)


if __name__ == '__main__':
    main()
